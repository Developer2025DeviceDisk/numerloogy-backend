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

    const updatedPricing = await Pricing.findOneAndUpdate(
      {}, // ✅ no filter → always single document
      {
        price,
        discount,
        buttonText,
        offerText,
        countdown,
      },
      {
        new: true,   // ✅ return updated document
        upsert: true // ✅ create if not exists
      }
    );

    res.status(200).json({
      success: true,
      message: "Pricing updated successfully",
      data: updatedPricing,
    });

  } catch (error) {
    console.error("🔥 ERROR:", error);
    next(error);
  }
};