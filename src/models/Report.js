const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema({
  fullName: String,
  email: { type: String, required: true },
  phone: String,
  dob: String,
  gender: String,
  location: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Report", ReportSchema);