/* global process */
import Stripe from "stripe"
import { readData, writeData } from "../config/fileStorage.js"
import { emitEvent } from "../services/eventBus.js"
import {
  createPaymentLocksForReservation,
  cleanupExpiredLocks,
  releaseLocksForReservation,
  PAYMENT_LOCK_TTL_MS,
  ensureReservationDoesNotConflictWithLocksOrReservations,
} from "../services/lockService.js"
import {
  LOYALTY_POINTS_PER_HOUR,
} from "../utils/reservationRules.js"
import { addLoyaltyPoints } from "./loyaltyController.js"
import { addNotification } from "../services/notificationService.js"

function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

function calculateHours(startTime, endTime) {
  return (timeToMinutes(endTime) - timeToMinutes(startTime)) / 60
}

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  return new Stripe(key)
}

function frontendBaseUrl() {
  return process.env.FRONTEND_URL || "http://localhost:5173"
}

function buildReservationPayload(body) {
  const { userName, objectName, date, startTime, endTime, pricePerHour } = body
  return { userName, objectName, date, startTime, endTime, pricePerHour }
}

function validateReservationPayload(payload) {
  const { userName, objectName, date, startTime, endTime, pricePerHour } = payload
  if (!userName || !objectName || !date || !startTime || !endTime || !pricePerHour) {
    return "Sva polja su obavezna."
  }
  if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
    return "Početno vrijeme mora biti prije završnog vremena."
  }
  if (Number(pricePerHour) <= 0) return "Cijena mora biti veća od 0."
  return null
}

function confirmReservationInData(data, reservation, paymentMeta = {}) {
  if (!reservation) return
  if (reservation.status === "CONFIRMED") return

  const duration = reservation.duration ?? calculateHours(reservation.startTime, reservation.endTime)
  reservation.duration = duration

  const loyaltyEarned = Math.floor(duration * LOYALTY_POINTS_PER_HOUR)
  reservation.loyaltyEarned = loyaltyEarned
  reservation.status = "CONFIRMED"
  reservation.paidAt = new Date().toISOString()
  reservation.payment = {
    provider: paymentMeta.provider ?? "mock",
    sessionId: paymentMeta.sessionId ?? null,
    amount: paymentMeta.amount ?? reservation.totalPrice,
    currency: paymentMeta.currency ?? "BAM",
  }

  addLoyaltyPoints(data, reservation.userName, loyaltyEarned)

  addNotification(data, {
    userName: reservation.userName,
    type: "CONFIRMATION",
    title: "Rezervacija potvrđena",
    message: `${reservation.objectName}, ${reservation.date} ${reservation.startTime}–${reservation.endTime}. Ukupno ${reservation.totalPrice} KM. +${loyaltyEarned} loyalty bodova.`,
    reservationId: reservation.id,
  })

  emitEvent("reservation.confirmed", { reservationId: reservation.id })
}

function confirmFromStripeSession(data, session) {
  const reservationId = Number(session?.metadata?.reservationId)
  if (!reservationId) {
    return { ok: false, message: "Sesija nema referencu rezervacije." }
  }

  const reservation = data.reservations.find((r) => r.id === reservationId)
  if (!reservation) {
    return { ok: false, message: "Rezervacija nije pronađena." }
  }

  if (reservation.status === "CONFIRMED") {
    return { ok: true, reservation, alreadyConfirmed: true }
  }

  if (reservation.status === "CANCELLED") {
    return { ok: false, message: "Rezervacija je otkazana (istekao lock)." }
  }

  const isPaid =
    session.payment_status === "paid" ||
    session.status === "complete"

  if (!isPaid) {
    return {
      ok: false,
      message: "Plaćanje nije završeno.",
      paymentStatus: session.payment_status,
    }
  }

  confirmReservationInData(data, reservation, {
    provider: "stripe",
    sessionId: session.id,
    amount: (session.amount_total ?? 0) / 100,
    currency: (session.currency || "bam").toUpperCase(),
  })
  releaseLocksForReservation(data, reservationId)

  return { ok: true, reservation }
}

export async function startCheckout(req, res) {
  const payload = buildReservationPayload(req.body)
  const error = validateReservationPayload(payload)
  if (error) {
    return res.status(400).json({ success: false, message: error })
  }

  const data = await readData()
  cleanupExpiredLocks(data)

  const conflict = ensureReservationDoesNotConflictWithLocksOrReservations(data, payload)
  if (!conflict.ok) {
    await writeData(data)
    return res.status(400).json({ success: false, message: conflict.message })
  }

  const duration = calculateHours(payload.startTime, payload.endTime)
  const reservation = {
    id: Date.now(),
    userName: payload.userName,
    objectName: payload.objectName,
    date: payload.date,
    startTime: payload.startTime,
    endTime: payload.endTime,
    duration,
    pricePerHour: Number(payload.pricePerHour),
    totalPrice: Number(payload.pricePerHour) * duration,
    status: "CREATED",
    reviewed: false,
    createdAt: new Date().toISOString(),
  }

  data.reservations.push(reservation)

  reservation.status = "WAITING_PAYMENT"
  const { expiresAtMs } = createPaymentLocksForReservation(data, reservation, PAYMENT_LOCK_TTL_MS)

  const stripe = getStripe()

  if (!stripe) {
    await writeData(data)
    return res.status(503).json({
      success: false,
      message: "Stripe nije konfiguriran. Postavite STRIPE_SECRET_KEY u backend/.env",
    })
  }

  const successUrl = `${frontendBaseUrl()}/user/payment/success?reservationId=${reservation.id}&session_id={CHECKOUT_SESSION_ID}`
  const cancelUrl = `${frontendBaseUrl()}/user/payment/cancel?reservationId=${reservation.id}`

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      reservationId: String(reservation.id),
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "bam",
          unit_amount: Math.round(reservation.totalPrice * 100),
          product_data: {
            name: `Rezervacija: ${reservation.objectName}`,
            description: `${reservation.date} ${reservation.startTime}–${reservation.endTime}`,
          },
        },
      },
    ],
  })

  reservation.payment = {
    provider: "stripe",
    sessionId: session.id,
    amount: reservation.totalPrice,
    currency: "BAM",
    status: "PENDING",
  }

  await writeData(data)

  return res.status(201).json({
    success: true,
    message: "Checkout kreiran.",
    data: {
      reservationId: reservation.id,
      expiresAtMs,
      checkoutUrl: session.url,
      paymentUrl: session.url,
      provider: "stripe",
    },
  })
}

export async function verifyCheckoutSession(req, res) {
  const reservationId = Number(req.body?.reservationId)
  const sessionId = req.body?.sessionId

  if (!reservationId || !sessionId) {
    return res.status(400).json({
      success: false,
      message: "reservationId i sessionId su obavezni.",
    })
  }

  const stripe = getStripe()
  if (!stripe) {
    return res.status(503).json({
      success: false,
      message: "Stripe nije konfiguriran.",
    })
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.metadata?.reservationId !== String(reservationId)) {
      return res.status(400).json({
        success: false,
        message: "Stripe sesija ne odgovara rezervaciji.",
      })
    }

    const data = await readData()
    cleanupExpiredLocks(data)

    const result = confirmFromStripeSession(data, session)

    if (!result.ok) {
      await writeData(data)
      return res.status(result.paymentStatus ? 402 : 400).json({
        success: false,
        message: result.message,
        paymentStatus: result.paymentStatus,
      })
    }

    if (!result.alreadyConfirmed) {
      await writeData(data)
    }

    res.json({
      success: true,
      message: "Plaćanje uspješno. Rezervacija potvrđena.",
      data: result.reservation,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || "Greška pri provjeri Stripe plaćanja.",
    })
  }
}

export async function abandonPayment(req, res) {
  const reservationId = Number(req.body?.reservationId)
  const { userName } = req.body

  if (!reservationId) {
    return res.status(400).json({ success: false, message: "reservationId je obavezan." })
  }

  const data = await readData()
  cleanupExpiredLocks(data)

  const reservation = data.reservations.find((r) => r.id === reservationId)

  if (!reservation) {
    return res.status(404).json({ success: false, message: "Rezervacija nije pronađena." })
  }

  if (userName && reservation.userName !== userName) {
    return res.status(403).json({ success: false, message: "Nemate pristup ovoj rezervaciji." })
  }

  if (reservation.status !== "WAITING_PAYMENT" && reservation.status !== "CREATED") {
    return res.status(400).json({
      success: false,
      message: "Rezervacija se ne može otkazati u ovom statusu.",
    })
  }

  reservation.status = "CANCELLED"
  reservation.cancelReason = "USER_EXIT_BOOKING"
  reservation.cancelledAt = new Date().toISOString()

  releaseLocksForReservation(data, reservationId)
  await writeData(data)

  res.json({
    success: true,
    message: "Rezervacija otkazana i termin oslobođen.",
  })
}

export async function mockConfirmPayment(req, res) {
  const reservationId = Number(req.body?.reservationId)
  if (!reservationId) {
    return res.status(400).json({ success: false, message: "reservationId je obavezan." })
  }

  const data = await readData()
  cleanupExpiredLocks(data)

  const reservation = data.reservations.find((r) => r.id === reservationId)
  if (!reservation) {
    return res.status(404).json({ success: false, message: "Rezervacija nije pronađena." })
  }
  if (reservation.status === "CANCELLED") {
    return res.status(400).json({ success: false, message: "Rezervacija je otkazana." })
  }

  confirmReservationInData(data, reservation, { provider: "mock" })
  releaseLocksForReservation(data, reservationId)

  await writeData(data)

  res.json({
    success: true,
    message: "Plaćanje potvrđeno (mock).",
    data: reservation,
  })
}

export async function webhook(req, res) {
  const stripe = getStripe()
  if (!stripe) {
    return res.status(400).send("Stripe nije konfiguriran.")
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    return res.status(400).send("Nedostaje STRIPE_WEBHOOK_SECRET.")
  }

  let event
  try {
    const signature = req.headers["stripe-signature"]
    event = stripe.webhooks.constructEvent(req.body, signature, secret)
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`)
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object

    const data = await readData()
    cleanupExpiredLocks(data)

    const result = confirmFromStripeSession(data, session)
    if (result.ok && !result.alreadyConfirmed) {
      await writeData(data)
    }

    return res.json({ received: true })
  }

  return res.json({ received: true })
}

