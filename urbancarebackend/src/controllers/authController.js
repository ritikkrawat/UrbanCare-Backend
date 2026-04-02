const User = require("../models/user.js");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken.js");

// ================= REGISTER =================
const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      mobile,
      password,
      gender,
      address,
      district,
      pincode
    } = req.body;

    if (!name || !email || !mobile || !password) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be filled"
      });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters"
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { mobile }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      mobile,
      password: hashedPassword,
      gender,
      address,
      district,
      pincode
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile
      }
    });

  } catch (error) {
    console.error("REGISTER ERROR:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// ================= LOGIN =================
const loginUser = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { mobile: identifier }
      ]
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // 🔥 BLOCK LOGIN IF SCHEDULED FOR DELETE
    if (user.isDeleted) {
      return res.status(403).json({
        success: false,
        message: "Account is scheduled for deletion. Please restore your account."
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile
      }
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// ================= DELETE INSTANT =================
const deleteInstant = async (req, res) => {
  try {
    const userId = req.user._id;

    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Account permanently deleted"
    });

  } catch (error) {
    console.error("INSTANT DELETE ERROR:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// ================= DELETE REQUEST =================
const deleteRequest = async (req, res) => {
  try {
    const userId = req.user._id;

    const deleteAfter = new Date();
    deleteAfter.setDate(deleteAfter.getDate() + 7);

    const user = await User.findByIdAndUpdate(
      userId,
      {
        isDeleted: true,
        deleteAt: deleteAfter
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Account scheduled for deletion in 7 days",
      deleteAt: user.deleteAt
    });

  } catch (error) {
    console.error("DELETE REQUEST ERROR:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// ================= CHANGE PASSWORD =================
const changePassword = async (req, res) => {
  try {
    const userId = req.user._id;
    const { oldPassword, newPassword } = req.body;

    // 1. Validate input
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters"
      });
    }

    // 2. Get user with password
    const user = await User.findById(userId).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // 3. Compare old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Old password is incorrect"
      });
    }

    // 4. Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 5. Update password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully"
    });

  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


// ================= EXPORT =================
module.exports = {
  registerUser,
  loginUser,
  deleteInstant,
  deleteRequest,
  changePassword
};