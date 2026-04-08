const mongoose = require("mongoose");

const PricingSchema = new mongoose.Schema(
  {
    price: {
      type: Number,
      required: true,
      default: 499,
    },
    discount: {
      type: Number,
      default: 0,
    },
    finalPrice: {
      type: Number,
    },
    buttonText: {
      type: String,
      default: "Get Started",
    },
    offerText: {
      type: String,
      default: "Limited Time Offer!",
    },
    countdown: {
      type: Number,
      default: 3600,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// ✅ NO next() USED — CLEAN VERSION
PricingSchema.pre("save", function () {
  this.finalPrice =
    this.price - (this.price * this.discount) / 100;
});

module.exports = mongoose.model("Pricing", PricingSchema);