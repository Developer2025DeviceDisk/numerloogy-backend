const Report = require("../models/Report");

exports.createReport = async (req, res) => {
  try {
    const report = new Report(req.body);
    await report.save();

    res.status(201).json({
      success: true,
      message: "Report saved successfully!"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error saving report",
      error: error.message
    });
  }
};