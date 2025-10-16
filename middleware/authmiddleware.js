const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  console.log("Auth middleware - All cookies:", req.cookies);
  const token = req.cookies.token; // ✅ read from cookie
  console.log("Auth middleware - Token from cookie:", token ? token.substring(0, 20) + "..." : "No token found");
  if (!token) return res.status(401).json({ message: "Not authorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = { authMiddleware };
