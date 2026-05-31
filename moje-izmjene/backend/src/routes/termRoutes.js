import express from "express"

import {
  getTerms,
  addTerm,
  addWeekTerms,
  updateTerm,
  lockTermSlots,
  unlockTermSlots,
  lockTermDay,
  deleteTerm,
} from "../controllers/termController.js"

const router = express.Router()

router.get("/", getTerms)
router.post("/week", addWeekTerms)
router.post("/", addTerm)
router.put("/:id", updateTerm)
router.post("/:id/lock-slots", lockTermSlots)
router.post("/:id/unlock-slots", unlockTermSlots)
router.post("/:id/lock", lockTermDay)
router.delete("/:id", deleteTerm)

export default router