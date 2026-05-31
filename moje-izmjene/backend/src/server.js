<<<<<<< HEAD
/* global process */
=======
>>>>>>> 4ffb565aaf6b17a6fe10e4e498a6a39ffe35c473
import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import objectRoutes from "./routes/objectRoutes.js"
import termRoutes from "./routes/termRoutes.js"
import workerRoutes from "./routes/workerRoutes.js"
import reservationRoutes from "./routes/reservationRoutes.js"
import authRoutes from "./routes/authRoutes.js"
import notificationRoutes from "./routes/notificationRoutes.js"
import reviewRoutes from "./routes/reviewRoutes.js"
import favoriteRoutes from "./routes/favoriteRoutes.js"
import loyaltyRoutes from "./routes/loyaltyRoutes.js"
<<<<<<< HEAD
import paymentRoutes from "./routes/paymentRoutes.js"
import eventRoutes from "./routes/eventRoutes.js"
import userRoutes from "./routes/userRoutes.js"
import specialProfileRoutes from "./routes/specialProfileRoutes.js"
import { cleanupExpiredLocks } from "./services/lockService.js"
import { readData, writeData } from "./config/fileStorage.js"
=======
>>>>>>> 4ffb565aaf6b17a6fe10e4e498a6a39ffe35c473

dotenv.config()

const app = express()

app.use(cors())
<<<<<<< HEAD

// Stripe webhook needs raw body; register before json middleware.
app.use("/api/payments/webhook", express.raw({ type: "application/json" }))

const jsonParser = express.json()
app.use((req, res, next) => {
  if (req.originalUrl === "/api/payments/webhook") return next()
  return jsonParser(req, res, next)
})
=======
app.use(express.json())
>>>>>>> 4ffb565aaf6b17a6fe10e4e498a6a39ffe35c473
app.use("/api/objects", objectRoutes)
app.use("/api/terms", termRoutes)
app.use("/api/workers", workerRoutes)
app.use("/api/reservations", reservationRoutes)
app.use("/api/auth", authRoutes)
app.use("/api/notifications", notificationRoutes)
app.use("/api/reviews", reviewRoutes)
app.use("/api/favorites", favoriteRoutes)
app.use("/api/loyalty", loyaltyRoutes)
<<<<<<< HEAD
app.use("/api/payments", paymentRoutes)
app.use("/api/events", eventRoutes)
app.use("/api/users", userRoutes)
app.use("/api/special-profiles", specialProfileRoutes)
=======
>>>>>>> 4ffb565aaf6b17a6fe10e4e498a6a39ffe35c473

app.get("/", (req, res) => {
  res.send("MojTeren backend radi")
})

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server radi na portu ${PORT}`)
<<<<<<< HEAD
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
=======
})
>>>>>>> 4ffb565aaf6b17a6fe10e4e498a6a39ffe35c473
