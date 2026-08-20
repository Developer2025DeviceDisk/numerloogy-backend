const express = require("express");

const router = express.Router();

const {
  createPaymentOrder,
} = require("../controllers/paymentController");

// Create Razorpay payment order
router.post("/create-order", createPaymentOrder);

module.exports = router;