import express from "express"
import { addSseClient } from "../services/eventBus.js"

const router = express.Router()

router.get("/", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream")
  res.setHeader("Cache-Control", "no-cache")
  res.setHeader("Connection", "keep-alive")

  // for proxies
  res.flushHeaders?.()

  res.write("event: connected\n")
  res.write(`data: ${JSON.stringify({ ok: true, ts: new Date().toISOString() })}\n\n`)

  addSseClient(res)
})

export default router

