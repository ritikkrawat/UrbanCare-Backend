const express = require("express");
const { registerUser } = require("../controllers/authController.jsx");

const router = express.Router();

router.post("/register", registerUser);

module.exports = router;