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

  } catch (error) {
    console.error("❌ Email sending failed:", error);
    throw new Error("Email failed");
  }
};

const sendComplaintConfirmationEmail = async ({ to, name, complaintId, category, description, date }) => {
  const clientUrl = process.env.NODE_ENV === "production"
    ? "https://urbancaredev.vercel.app"
    : "http://localhost:3000";

  try {
    await transporter.sendMail({
      from: `"UrbanCare Support" <${process.env.EMAIL_USER}>`,
      to,
      subject: `Complaint Received — ID: ${complaintId}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;">
          <h2 style="color:#7b003f;">UrbanCare</h2>
          <p>Dear <strong>${name}</strong>,</p>
          <p>Your complaint has been successfully submitted. Here are your details:</p>

          <div style="background:#fdf0f5;border-left:4px solid #7b003f;border-radius:6px;padding:16px 20px;margin:20px 0;">
            <p style="margin:0 0 8px"><strong>Complaint ID:</strong> 
              <span style="color:#7b003f;font-size:18px;font-weight:bold;">${complaintId}</span>
            </p>
            <p style="margin:0 0 8px"><strong>Category:</strong> ${category}</p>
            <p style="margin:0 0 8px"><strong>Description:</strong> ${description}</p>
            <p style="margin:0"><strong>Submitted On:</strong> ${date}</p>
          </div>

          <p>Track your complaint anytime — no login needed:</p>
          <a href="${CLIENT_URL}/status"
             style="display:inline-block;background:#7b003f;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold;">
            Track My Complaint →
          </a>

          <hr style="margin-top:32px"/>
          <p style="font-size:12px;color:gray;">
            If you did not submit this complaint, please contact us immediately.
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error("❌ Complaint confirmation email failed:", error);
    throw new Error("Email failed");
  }
};

module.exports = { sendOTPEmail, sendComplaintConfirmationEmail }; 