require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/db");
const app = express();
connectDB();
app.use(cors());
app.use(express.json());

app.use("/api", require("./src/routes"));

app.get("/", (req, res) => {
  res.send("🚀 Server is running cleanly");
});

app.use((err, req, res, next) => {
  console.error("🔥 Error:", err.message);

  res.status(500).json({
    success: false,
    message: "Internal Server Error"
  });
});
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`👉 API Base URL: http://localhost:${PORT}/api`);
});