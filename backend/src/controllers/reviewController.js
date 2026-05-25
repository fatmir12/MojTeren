import { readData, writeData } from "../config/fileStorage.js"
import { isReservationReviewable } from "../utils/reservationRules.js"

export async function getReviews(req, res) {
  const { objectName } = req.query
  const data = await readData()

  let reviews = data.reviews || []

  if (objectName) {
    reviews = reviews.filter((r) => r.objectName === objectName)
  }

  res.json({
    success: true,
    data: reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
  })
}

export async function addReview(req, res) {
  const { userName, objectName, reservationId, rating, comment } = req.body

  if (!userName || !objectName || !reservationId || !rating) {
    return res.status(400).json({
      success: false,
      message: "Korisnik, objekat, rezervacija i ocjena su obavezni.",
    })
  }

  const ratingNum = Number(rating)

  if (ratingNum < 1 || ratingNum > 5) {
    return res.status(400).json({
      success: false,
      message: "Ocjena mora biti između 1 i 5.",
    })
  }

  const data = await readData()

  const reservation = data.reservations.find(
    (r) => r.id === Number(reservationId) && r.userName === userName
  )

  if (!reservation) {
    return res.status(404).json({
      success: false,
      message: "Rezervacija nije pronađena.",
    })
  }

  if (!isReservationReviewable(reservation)) {
    return res.status(400).json({
      success: false,
      message: "Recenziju možete ostaviti tek nakon završenog termina.",
    })
  }

  const existing = (data.reviews || []).find(
    (r) => r.reservationId === Number(reservationId)
  )

  if (existing) {
    return res.status(400).json({
      success: false,
      message: "Već ste ocijenili ovu rezervaciju.",
    })
  }

  if (!data.reviews) {
    data.reviews = []
  }

  const newReview = {
    id: Date.now(),
    userName,
    objectName,
    reservationId: Number(reservationId),
    rating: ratingNum,
    comment: comment || "",
    createdAt: new Date().toISOString(),
  }

  data.reviews.push(newReview)

  const reservationIndex = data.reservations.findIndex(
    (r) => r.id === Number(reservationId)
  )
  if (reservationIndex !== -1) {
    data.reservations[reservationIndex].reviewed = true
  }

  await writeData(data)

  res.status(201).json({
    success: true,
    message: "Recenzija uspješno dodana.",
    data: newReview,
  })
}
