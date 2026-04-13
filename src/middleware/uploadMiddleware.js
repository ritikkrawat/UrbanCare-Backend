const multer = require("multer");
const path = require("path");
const fs = require("fs");

const createFolder = (folder) => {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
};

// Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.mimetype.startsWith("image")) {
      createFolder("uploads/images");
      cb(null, "uploads/images");
    } else if (file.mimetype.startsWith("video")) {
      createFolder("uploads/videos");
      cb(null, "uploads/videos");
    }
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

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