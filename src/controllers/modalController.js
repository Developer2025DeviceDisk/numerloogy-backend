const ModalReport = require("../models/ModalReport");

exports.createModal = async (req, res) => {
  try {
    const { fullName, email, phone, dob, birthPlace } = req.body;

    if (!email || !phone) {
      return res.status(400).json({
        success: false,
        message: "Email and phone are required"
      });
    }

    const newModal = new ModalReport({ fullName, email, phone, dob, birthPlace });
    await newModal.save();

    res.status(201).json({
      success: true,
      message: "Modal form submitted successfully!"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error saving modal form",
      error: error.message
    });
  }
};