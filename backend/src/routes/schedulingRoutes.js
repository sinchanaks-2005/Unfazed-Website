const express = require("express");

const {
  getAvailability,
  updateAvailability,
  getAvailableSlots,
  bookSession,
  getSessions,
} = require("../controllers/schedulingController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// ==========================================
// THERAPIST AVAILABILITY
// ==========================================

// Get therapist availability
router.get(
  "/availability",
  protect,
  getAvailability
);

// Update therapist availability
router.put(
  "/availability",
  protect,
  updateAvailability
);

// ==========================================
// THERAPIST SESSIONS (PROTECTED)
// ==========================================

// Get all sessions for logged-in therapist
// Optional: ?tab=upcoming|completed
router.get("/sessions", protect, getSessions);

// ==========================================
// CLIENT AVAILABLE SLOTS & BOOKING
// ==========================================

// Get available booking slots
router.get(
  "/slots",
  getAvailableSlots
);

// Book a session
router.post(
  "/book",
  bookSession
);

module.exports = router;