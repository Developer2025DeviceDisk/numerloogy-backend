const express = require("express");

const router = express.Router();

const contactRoutes = require("./contactRoutes");
const reportRoutes = require("./reportRoutes");
const subscriberRoutes = require("./subscriberRoutes");
const modalRoutes = require("./modalRoutes");
const pricingRoutes = require("./pricingRoutes");
const paymentRoutes = require("./paymentRoutes");

// Mount routes
router.use("/contact", contactRoutes);
router.use("/reports", reportRoutes);
router.use("/subscribe", subscriberRoutes);
router.use("/modal", modalRoutes);
router.use("/pricing", pricingRoutes);
router.use("/payment", paymentRoutes);

module.exports = router;