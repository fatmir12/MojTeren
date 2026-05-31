import express from "express"
import {
  assignSpecialProfile,
} from "../controllers/specialProfileController.js"

const router = express.Router()

router.post("/assign", assignSpecialProfile)

export default router

