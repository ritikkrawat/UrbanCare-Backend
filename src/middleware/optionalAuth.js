const jwt = require("jsonwebtoken");
const User = require("../models/user.js");

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer")) {
      return next(); // no token → continue as unauthenticated
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // mirror your protect middleware exactly
    if (decoded.role === "admin") {
      req.user = decoded;
      return next();
    }

    const user = await User.findById(decoded.id).select("-password");
    if (user) req.user = user;

  } catch {
    req.user = null; // bad/expired token → treat as unauthenticated
  }

  next();
};

module.exports = optionalAuth;