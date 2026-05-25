import express from "express"

import {
  getObjects,
  addObject,
  updateObject,
  deleteObject,
} from "../controllers/objectController.js"

const router = express.Router()

router.get("/", getObjects)
router.post("/", addObject)
router.put("/:id", updateObject)
router.delete("/:id", deleteObject)

export default router