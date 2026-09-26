const { canAccess } = require("../services/entitlementService");

/**
 * Middleware factory to enforce feature entitlements.
 *
 * @param {string | ((req: Object) => string)} featureParam
 */
const requireEntitlement = (featureParam) => {
  return async (req, res, next) => {
    try {
      if (!req.therapist?._id) {
        return res.status(401).json({
          message: "Authentication required to check feature entitlement.",
        });
      }

      const featureKey =
        typeof featureParam === "function" ? featureParam(req) : featureParam;

      const access = await canAccess(req.therapist._id, featureKey);

      if (!access.allowed) {
        return res.status(403).json({
          message: access.reason || "This feature requires an upgraded subscription tier.",
          upgradeRequired: true,
          currentTier: access.currentTier,
          requiredTier: access.requiredTier || "pro",
        });
      }

      next();
    } catch (error) {
      console.error("Entitlement middleware error:", error.message);
      res.status(500).json({
        message: "Server error verifying feature entitlement.",
      });
    }
  };
};

module.exports = requireEntitlement;

