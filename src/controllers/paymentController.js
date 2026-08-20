const Razorpay = require("razorpay");
const crypto = require("crypto");
const Pricing = require("../models/Pricing");
const {
  createPaymentOrder,
  verifyPayment,
} = require("../controllers/paymentController");

// =========================================================
// RAZORPAY CONFIGURATION
// =========================================================

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.warn(
    "⚠️ Razorpay credentials are missing from environment variables"
  );
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// =========================================================
// CREATE PAYMENT ORDER
// POST /api/payment/create-order
// =========================================================

exports.createPaymentOrder = async (req, res) => {
  try {
    console.log("💳 Creating Razorpay payment order...");

    // -------------------------------------------------------
    // 1. Get pricing from MongoDB
    // -------------------------------------------------------

    const pricing = await Pricing.findOne();

    if (!pricing) {
      console.error("❌ Pricing document not found");

      return res.status(404).json({
        success: false,
        message: "Pricing information not found",
      });
    }

    console.log("💰 Pricing found:", {
      price: pricing.price,
      discount: pricing.discount,
      finalPrice: pricing.finalPrice,
      isActive: pricing.isActive,
      offerId: pricing.offerId,
    });

    // -------------------------------------------------------
    // 2. Calculate final price
    // -------------------------------------------------------

    let finalPrice = Number(pricing.finalPrice);

    // Fallback calculation in case finalPrice isn't available
    if (!Number.isFinite(finalPrice)) {
      const price = Number(pricing.price) || 0;
      const discount = Number(pricing.discount) || 0;

      finalPrice = price - (price * discount) / 100;
    }

    // -------------------------------------------------------
    // 3. Validate price
    // -------------------------------------------------------

    if (!Number.isFinite(finalPrice) || finalPrice <= 0) {
      console.error("❌ Invalid payment amount:", finalPrice);

      return res.status(400).json({
        success: false,
        message: "Invalid payment amount",
      });
    }

    // -------------------------------------------------------
    // 4. Convert INR to paise
    //
    // ₹499 = 49900 paise
    // -------------------------------------------------------

    const amountInPaise = Math.round(finalPrice * 100);

    console.log(`💰 Payment amount: ₹${finalPrice}`);
    console.log(`💰 Razorpay amount: ${amountInPaise} paise`);

    // -------------------------------------------------------
    // 5. Check Razorpay credentials
    // -------------------------------------------------------

    if (
      !process.env.RAZORPAY_KEY_ID ||
      !process.env.RAZORPAY_KEY_SECRET
    ) {
      console.error("❌ Razorpay credentials are missing");

      return res.status(500).json({
        success: false,
        message: "Payment gateway configuration is missing",
      });
    }

    // -------------------------------------------------------
    // 6. Create Razorpay order
    // -------------------------------------------------------

    const options = {
      amount: amountInPaise,
      currency: "INR",

      receipt: `receipt_${Date.now()}`,

      notes: {
        offerId: pricing.offerId || "",
        product: "Numerology Consultation",
        price: String(pricing.price || ""),
        discount: String(pricing.discount || 0),
      },
    };

    console.log("📦 Razorpay order options:", options);

    const order = await razorpay.orders.create(options);

    console.log("✅ Razorpay order created:", order.id);

    // -------------------------------------------------------
    // 7. Send order to frontend
    // -------------------------------------------------------

    return res.status(200).json({
      success: true,
      message: "Payment order created successfully",

      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,

        key: process.env.RAZORPAY_KEY_ID,

        pricing: {
          price: pricing.price,
          discount: pricing.discount,
          finalPrice,
          offerId: pricing.offerId,
        },
      },
    });
  } catch (error) {
    // -------------------------------------------------------
    // Razorpay / server error
    // -------------------------------------------------------

    console.error("🔥 Razorpay payment order error:");

    console.error("Message:", error.message);

    if (error.statusCode) {
      console.error("Status Code:", error.statusCode);
    }

    if (error.error) {
      console.error("Razorpay Error:", error.error);
    }

    return res.status(error.statusCode || 500).json({
      success: false,
      message: "Failed to create payment order",

      error:
        error?.error?.description ||
        error?.message ||
        "Unknown payment gateway error",
    });
  }
};

// =========================================================
// VERIFY PAYMENT
// POST /api/payment/verify
// =========================================================

exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    // -------------------------------------------------------
    // Validate required fields
    // -------------------------------------------------------

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing payment verification details",
      });
    }

    // -------------------------------------------------------
    // Generate expected signature
    // -------------------------------------------------------

    const generatedSignature = crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_KEY_SECRET
      )
      .update(
        `${razorpay_order_id}|${razorpay_payment_id}`
      )
      .digest("hex");

    // -------------------------------------------------------
    // Compare signatures
    // -------------------------------------------------------

    if (generatedSignature !== razorpay_signature) {
      console.error("❌ Invalid Razorpay payment signature");

      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    console.log("✅ Razorpay payment verified:", {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
    });

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      },
    });
  } catch (error) {
    console.error("🔥 Payment verification error:", error);

    return res.status(500).json({
      success: false,
      message: "Payment verification failed",
      error: error.message,
    });
  }
};