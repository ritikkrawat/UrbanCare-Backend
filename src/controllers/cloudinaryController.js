const crypto = require("crypto");

const generateSignature = (req, res) => {
  const timestamp = Math.round(Date.now() / 1000);

  const signature = crypto
    .createHash("sha1")
    .update(`timestamp=${timestamp}${process.env.CLOUDINARY_API_SECRET}`)
    .digest("hex");

  res.json({
    timestamp,
    signature,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
  });
};

module.exports = { generateSignature };