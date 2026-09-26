const express = require("express");
const protect = require("../middleware/authMiddleware");
const requireEntitlement = require("../middleware/entitlementMiddleware");
const {
  getClients,
  getClientById,
  createClient,
  updateClient,
  submitIntake,
} = require("../controllers/clientController");

const router = express.Router();

// Public client intake submission & consent
router.post("/intake", submitIntake);

// Protected therapist CRM routes
router.get("/", protect, getClients);
router.post("/", protect, requireEntitlement("canAddClient"), createClient);
router.get("/:clientId", protect, getClientById);
router.put("/:clientId", protect, updateClient);

module.exports = router;

