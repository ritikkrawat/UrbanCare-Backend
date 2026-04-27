const jwt = require("jsonwebtoken");

const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // ENV credentials
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    // Check credentials
    if (username !== adminEmail || password !== adminPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials",
      });
    }

    // Create fake admin payload
    const admin = {
      id: "admin-1",
      email: adminEmail,
      role: "admin",
    };

    // Generate token
    const token = jwt.sign(admin, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      success: true,
      message: "Admin login successful",
      token,
      user: admin,
    });

  } catch (error) {
    console.error("ADMIN LOGIN ERROR:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = { adminLogin };