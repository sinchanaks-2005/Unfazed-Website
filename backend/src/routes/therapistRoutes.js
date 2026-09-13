const express = require("express");

const {
  signupTherapist,
  loginTherapist,
  getTherapistProfile,
  updateTherapistProfile,
  getPublicTherapistBySlug,
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
// PUBLIC BRANDED THERAPIST PROFILE
// ==========================================

// Get therapist profile using branded slug
router.get("/public/:slug", getPublicTherapistBySlug);

module.exports = router;