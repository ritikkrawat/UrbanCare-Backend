const express = require("express");
const router = express.Router();
const { getStates, getDistricts } = require("../controllers/locationContoller.js");

router.get("/states", getStates);
router.get("/districts/:state", getDistricts);

module.exports = router;