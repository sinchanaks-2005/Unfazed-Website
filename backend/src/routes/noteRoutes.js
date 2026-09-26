const express = require("express");
const protect = require("../middleware/authMiddleware");
const {
  createNote,
  getTherapistClientNotes,
  getClientSharedNotes,
  updateNote,
} = require("../controllers/noteController");

const router = express.Router();

// Client portal route (CRITICAL PRIVACY: ONLY shared notes returned)
router.get("/client/:clientId/shared", getClientSharedNotes);

// Therapist protected clinical documentation routes
router.post("/", protect, createNote);
router.get("/client/:clientId", protect, getTherapistClientNotes);
router.put("/:noteId", protect, updateNote);

module.exports = router;

