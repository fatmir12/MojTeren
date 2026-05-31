import express from "express"

import {
  getWorkers,
  addWorker,
  updateWorker,
  deleteWorker,
} from "../controllers/workerController.js"

const router = express.Router()

router.get("/", getWorkers)
router.post("/", addWorker)
router.put("/:id", updateWorker)
router.delete("/:id", deleteWorker)

export default router