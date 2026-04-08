const express = require("express");
const router = express.Router();
const { subscribe } = require("../controllers/subscriberController");

router.post("/", subscribe);

module.exports = router;