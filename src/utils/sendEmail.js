const nodemailer = require("nodemailer");
require("dotenv").config();

// 🔧 Create transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ✅ Verify connection (runs once on startup)
transporter.verify((err, success) => {
  if (err) {
    console.error("❌ Email config error:", err);
  } else {
    console.log("✅ Email server ready");
  }
});

const sendOTPEmail = async (to, otp, type = "reset") => {
  try {
    const isRegistration = type === "register";

    const subject = isRegistration
      ? "UrbanCare Account Verification OTP"
      : "UrbanCare Password Reset OTP";

    const actionText = isRegistration
      ? "verify your email"
      : "reset your password";

    const info = await transporter.sendMail({
      from: `"UrbanCare Support" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: `
        <div style="font-family: Arial; max-width:500px; margin:auto; padding:20px;">
          <h2 style="color:#1a56a0;">UrbanCare</h2>
          
          <p>Hello,</p>
          <p>Use the OTP below to <strong>${actionText}</strong>:</p>

          <div style="
            font-size: 30px;
            font-weight: bold;
            color:#1a56a0;
            text-align:center;
            letter-spacing: 5px;
            margin: 20px 0;
          ">
            ${otp}
          </div>

          <p>This OTP is valid for <strong>2 minutes</strong>.</p>

          <hr/>
          <p style="font-size:12px; color:gray;">
            If you didn’t request this, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    console.log(`📩 OTP email sent to ${to}`);
    console.log("Message ID:", info.messageId);

  } catch (error) {
    console.error("❌ Email sending failed:", error);
    throw new Error("Email failed");
  }
};

module.exports = { sendOTPEmail };