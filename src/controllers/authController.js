const User = require("../models/user.js");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken.js");
const { sendOTPEmail } = require("../utils/sendEmail.js");
const otpStore = require("../utils/otpStore.js");
// ================= REGISTER =================
const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      mobile,
      password,
      gender,
      address1,
      address2,
      state,
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
      if (existingUser.email === email.toLowerCase()) {
        return res.status(400).json({
          success: false,
          message: "An account with this email already exists. Please login."
        });
      }
      if (existingUser.mobile === mobile) {
        return res.status(400).json({
          success: false,
          message: "An account with this mobile number already exists. Please login."
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      mobile,
      password: hashedPassword,
      gender,
      address1,
      address2,
      state,
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
      return res.status(404).json({        
        success: false,
        message: "No account found with this email."
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({        
        success: false,
        message: "Incorrect password. Please try again."
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

// ================= GENERATE OTP =================
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// ================= FORGOT PASSWORD =================
const forgotPassword = async (req, res) => {
  try {
    const { email, mobile } = req.body;

    if (!email && !mobile) {
      return res.status(400).json({
        success: false,
        message: "Email or Mobile is required"
      });
    }

    const query = [];
    if (email) query.push({ email: email.toLowerCase() });
    if (mobile) query.push({ mobile });

    const user = await User.findOne({ $or: query });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const otp = generateOTP();

    user.otp = otp;
    user.otpExpiry = Date.now() + 2 * 60 * 1000;

    await user.save();

    // ✅ EMAIL SEND
    if (email) {
      await sendOTPEmail(email, otp);
    }

    res.status(200).json({
      success: true,
      message: "OTP sent successfully"
    });

  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// ================= VERIFY OTP =================
const verifyOTP = async (req, res) => {
  try {
    const { email, mobile, otp } = req.body;

    const query = [];
    if (email) query.push({ email: email.toLowerCase() });
    if (mobile) query.push({ mobile });

    const user = await User.findOne({ $or: query });

    if (!user || user.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP"
      });
    }

    if (user.otpExpiry < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "OTP expired"
      });
    }

    res.status(200).json({
      success: true,
      message: "OTP verified"
    });

  } catch (error) {
    console.error("VERIFY OTP ERROR:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// ================= RESET PASSWORD =================
const resetPassword = async (req, res) => {
  try {
    const { email, mobile, password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters"
      });
    }

    const query = [];
    if (email) query.push({ email: email.toLowerCase() });
    if (mobile) query.push({ mobile });

    const user = await User.findOne({ $or: query }).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;
    user.otp = null;
    user.otpExpiry = null;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successful"
    });

  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// ================= SEND OTP (REGISTRATION) =================
const { performance } = require("perf_hooks");

const sendOtpForRegistration = async (req, res) => {
  const start = performance.now(); // 🔵 total start

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const t1 = performance.now();

    const existingUser = await User.findOne({ email: email.toLowerCase() });

    const t2 = performance.now();

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email"
      });
    }

    const otp = generateOTP();

    const t3 = performance.now();

    otpStore[email] = {
      otp,
      expiry: Date.now() + 2 * 60 * 1000
    };

    const t4 = performance.now();

    // ✅ respond FIRST
    res.status(200).json({
      success: true,
      message: "OTP sent successfully"
    });

    const t5 = performance.now();

    // ✅ send email AFTER response
    sendOTPEmail(email, otp, "register")
      .then(() => {
        const t6 = performance.now();

        console.log("📧 Email send time:", (t6 - t5).toFixed(2), "ms");
        console.log("🧠 Total backend time (including async email):", (t6 - start).toFixed(2), "ms");
      })
      .catch(err => {
        console.error("Email error:", err.message);
      });

    // 🔍 Logs BEFORE email (important)
    console.log("🔎 DB check:", (t2 - t1).toFixed(2), "ms");
    console.log("🔎 OTP generation:", (t3 - t2).toFixed(2), "ms");
    console.log("🔎 Store OTP:", (t4 - t3).toFixed(2), "ms");
    console.log("🚀 API response time:", (t5 - start).toFixed(2), "ms");

  } catch (error) {
    console.error("SEND OTP ERROR:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// ================= VERIFY OTP (REGISTRATION) =================
const verifyRegistrationOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const record = otpStore[email];

    if (!record) {
      return res.status(400).json({
        success: false,
        message: "OTP not found. Please request again."
      });
    }

    if (record.expiry < Date.now()) {
      delete otpStore[email];
      return res.status(400).json({
        success: false,
        message: "OTP expired"
      });
    }

    if (record.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP"
      });
    }

    // OTP correct → delete it
    delete otpStore[email];

    res.status(200).json({
      success: true,
      message: "OTP verified successfully"
    });

  } catch (error) {
    console.error("VERIFY REG OTP ERROR:", error.message);

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
  forgotPassword,
  verifyOTP,
  resetPassword,
  sendOtpForRegistration,
  verifyRegistrationOtp
};