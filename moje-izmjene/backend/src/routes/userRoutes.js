import express from "express"
import { searchUsers, getUserById } from "../controllers/userController.js"

const router = express.Router()

router.get("/", searchUsers)
router.get("/:id", getUserById)

export default router

