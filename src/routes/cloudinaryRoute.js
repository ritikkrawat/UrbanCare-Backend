const express = require("express");
const router = express.Router();
const { generateSignature } = require("../controllers/cloudinaryController");

router.get("/signature", generateSignature);

module.exports = router;