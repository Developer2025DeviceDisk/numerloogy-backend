const express = require("express");
const router = express.Router();

const {
  getPricing,
  createOrUpdatePricing,
} = require("../controllers/pricingController");

// Public route
router.get("/", getPricing);

// Admin route
router.put("/create-or-update", createOrUpdatePricing);

module.exports = router;