const statesData = require("../utils/statesAndDistrict.js"); // same file you used in frontend

// GET all states
const getStates = (req, res) => {
  try {
    const states = statesData.states.map((s) => s.state);
    res.json({ success: true, states });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET districts by state
const getDistricts = (req, res) => {
  try {
    const { state } = req.params;

    const found = statesData.states.find((s) => s.state === state);

    if (!found) {
      return res.status(404).json({
        success: false,
        message: "State not found"
      });
    }

    res.json({
      success: true,
      districts: found.districts
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getStates, getDistricts };