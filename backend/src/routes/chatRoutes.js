const express = require("express");
const protect = require("../middleware/authMiddleware");
const {
  getChatHistory,
} = require("../controllers/chatController");

const router = express.Router();

// Therapist chat history
router.get(
  "/history/:clientId",
  protect,
  getChatHistory
);

module.exports = router;