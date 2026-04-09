const Pricing = require("../models/Pricing");

// ✅ Get Pricing (single document)
exports.getPricing = async (req, res) => {
  try {
    const pricing = await Pricing.findOne(); // ✅ always get single doc

    res.status(200).json({
      success: true,
      data: pricing,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch pricing",
      error: error.message,
    });
  }
};

// ✅ Create or Update Pricing (Admin)
exports.createOrUpdatePricing = async (req, res, next) => {
  try {
    const { price, discount, buttonText, offerText, countdown } = req.body;

    let pricing = await Pricing.findOne();

    if (pricing) {
      // ✅ UPDATE → triggers new offerId
      pricing.price = price;
      pricing.discount = discount;
      pricing.buttonText = buttonText;
      pricing.offerText = offerText;
      pricing.countdown = countdown;

      await pricing.save(); // 🔥 THIS triggers new offerId
    } else {
      // ✅ CREATE
      pricing = await Pricing.create({
        price,
        discount,
        buttonText,
        offerText,
        countdown,
      });
    }

    res.status(200).json({
      success: true,
      message: "Pricing updated successfully",
      data: pricing,
    });

  } catch (error) {
    console.error("🔥 ERROR:", error);
    next(error);
  }
};