import express from "express"
import {
  startCheckout,
  webhook,
  mockConfirmPayment,
  abandonPayment,
  verifyCheckoutSession,
} from "../controllers/paymentController.js"

const router = express.Router()

router.post("/start", startCheckout)
router.post("/verify-session", verifyCheckoutSession)
router.post("/abandon", abandonPayment)
router.post("/mock/confirm", mockConfirmPayment)

router.post("/webhook", webhook)

export default router

