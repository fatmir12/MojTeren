import express from "express"
import { getLoyalty, updateReminders } from "../controllers/loyaltyController.js"

const router = express.Router()

router.get("/", getLoyalty)
router.put("/reminders", updateReminders)

export default router
