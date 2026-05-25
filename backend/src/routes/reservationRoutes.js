import express from "express"

import {
  getReservations,
  addReservation,
  updateReservation,
  deleteReservation,
  cancelReservation,
} from "../controllers/reservationController.js"

const router = express.Router()

router.get("/", getReservations)
router.post("/", addReservation)
router.post("/:id/cancel", cancelReservation)
router.put("/:id", updateReservation)
router.delete("/:id", deleteReservation)

export default router