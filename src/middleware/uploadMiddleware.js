const multer = require("multer");

// ✅ Use memory storage (NO local files)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype.startsWith("image") ||
    file.mimetype.startsWith("video")
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only images/videos allowed"), false);
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;