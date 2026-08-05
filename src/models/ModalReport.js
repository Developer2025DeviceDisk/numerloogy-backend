const mongoose = require("mongoose");

const ModalSchema = new mongoose.Schema({
  fullName: String,
  email: { type: String, required: true },
  phone: { type: String, required: true },
  dob: String,
  birthPlace: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("ModalReport", ModalSchema);