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

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())
app.use("/api/objects", objectRoutes)
app.use("/api/terms", termRoutes)
app.use("/api/workers", workerRoutes)
app.use("/api/reservations", reservationRoutes)
app.use("/api/auth", authRoutes)
app.use("/api/notifications", notificationRoutes)
app.use("/api/reviews", reviewRoutes)
app.use("/api/favorites", favoriteRoutes)
app.use("/api/loyalty", loyaltyRoutes)

app.get("/", (req, res) => {
  res.send("MojTeren backend radi")
})

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server radi na portu ${PORT}`)
})