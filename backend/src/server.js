/* global process */
import "./loadEnv.js"
import express from "express"
import cors from "cors"
import objectRoutes from "./routes/objectRoutes.js"
import termRoutes from "./routes/termRoutes.js"
import workerRoutes from "./routes/workerRoutes.js"
import reservationRoutes from "./routes/reservationRoutes.js"
import authRoutes from "./routes/authRoutes.js"
import notificationRoutes from "./routes/notificationRoutes.js"
import reviewRoutes from "./routes/reviewRoutes.js"
import favoriteRoutes from "./routes/favoriteRoutes.js"
import loyaltyRoutes from "./routes/loyaltyRoutes.js"
import paymentRoutes from "./routes/paymentRoutes.js"
import eventRoutes from "./routes/eventRoutes.js"
import userRoutes from "./routes/userRoutes.js"
import specialProfileRoutes from "./routes/specialProfileRoutes.js"
import { cleanupExpiredLocks } from "./services/lockService.js"
import { readData, writeData } from "./config/fileStorage.js"

const app = express()

app.use(cors())

// Stripe webhook needs raw body; register before json middleware.
app.use("/api/payments/webhook", express.raw({ type: "application/json" }))

const jsonParser = express.json()
app.use((req, res, next) => {
  if (req.originalUrl === "/api/payments/webhook") return next()
  return jsonParser(req, res, next)
})
app.use("/api/objects", objectRoutes)
app.use("/api/terms", termRoutes)
app.use("/api/workers", workerRoutes)
app.use("/api/reservations", reservationRoutes)
app.use("/api/auth", authRoutes)
app.use("/api/notifications", notificationRoutes)
app.use("/api/reviews", reviewRoutes)
app.use("/api/favorites", favoriteRoutes)
app.use("/api/loyalty", loyaltyRoutes)
app.use("/api/payments", paymentRoutes)
app.use("/api/events", eventRoutes)
app.use("/api/users", userRoutes)
app.use("/api/special-profiles", specialProfileRoutes)

app.get("/", (req, res) => {
  res.send("MojTeren backend radi")
})

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  const stripeReady = Boolean(process.env.STRIPE_SECRET_KEY?.trim())
  console.log(`Server radi na portu ${PORT}`)
  console.log(stripeReady ? "Stripe: konfiguriran" : "Stripe: NEDOSTAJE STRIPE_SECRET_KEY u backend/.env")
})

// Background sweeper for 5-min payment locks.
setInterval(async () => {
  try {
    const data = await readData()
    const { expired } = cleanupExpiredLocks(data)
    if (expired.length > 0) {
      await writeData(data)
    }
  } catch {
    /* ignore */
  }
}, 15_000)
