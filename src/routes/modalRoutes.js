const express = require("express");
const router = express.Router();
const { createModal } = require("../controllers/modalController");

router.post("/", createModal);

module.exports = router;