const Contact = require("../models/contact");

exports.createContact = async (req, res) => {
  try {
    const newContact = new Contact(req.body);
    await newContact.save();

    res.status(201).json({
      success: true,
      message: "Contact message saved!"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error saving contact",
      error: error.message
    });
  }
};