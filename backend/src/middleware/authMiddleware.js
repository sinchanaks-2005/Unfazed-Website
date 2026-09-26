const jwt = require("jsonwebtoken");
const Therapist = require("../models/Therapist");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const therapist = await Therapist.findById(
      decoded.therapistId
    ).select("-password_hash");

    if (!therapist) {
      return res.status(401).json({
        message: "Therapist not found",
      });
    }

    req.therapist = therapist;

    next();
  } catch (error) {
    console.error("Authentication error:", error.message);

    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

module.exports = protect;