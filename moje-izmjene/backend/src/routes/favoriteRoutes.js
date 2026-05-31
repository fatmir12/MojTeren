import express from "express"
import { getFavorites, toggleFavorite } from "../controllers/favoriteController.js"

const router = express.Router()

router.get("/", getFavorites)
router.post("/toggle", toggleFavorite)

export default router
