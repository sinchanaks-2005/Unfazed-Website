const express = require("express");

const {
  signupTherapist,
  loginTherapist,
  getTherapistProfile,
  updateTherapistProfile,
  getPublicTherapistBySlug,
  getPublicTherapists,
} = require("../controllers/therapistController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// ==========================================
// PUBLIC AUTH ROUTES
// ==========================================

router.post("/signup", signupTherapist);

router.post("/login", loginTherapist);

// ==========================================
// PROTECTED PROFILE ROUTES
// ==========================================

// Get logged-in therapist profile
router.get("/profile", protect, getTherapistProfile);

// Update logged-in therapist profile
router.put("/profile", protect, updateTherapistProfile);

// ==========================================
// PUBLIC THERAPIST DIRECTORY
// ==========================================

// Example:
// GET /api/therapists/public?specialization=CBT&search=anxiety
router.get("/public", getPublicTherapists);

// ==========================================
// PUBLIC BRANDED THERAPIST PROFILE
// ==========================================

// Example:
// GET /api/therapists/public/dr-priya
router.get("/public/:slug", getPublicTherapistBySlug);

module.exports = router;