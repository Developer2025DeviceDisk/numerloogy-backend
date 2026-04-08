const Subscriber = require("../models/Subscriber");

exports.subscribe = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.includes("@")) {
      return res.status(400).json({
        success: false,
        message: "Invalid email address"
      });
    }

    const existing = await Subscriber.findOne({ email });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "You're already subscribed!"
      });
    }

    const newSubscriber = new Subscriber({ email });
    await newSubscriber.save();

    res.status(201).json({
      success: true,
      message: "Subscribed successfully!"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error saving subscription",
      error: error.message
    });
  }
};