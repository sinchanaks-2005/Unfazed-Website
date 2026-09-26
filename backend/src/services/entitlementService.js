const Therapist = require("../models/Therapist");
const SubscriptionTierConfig = require("../models/SubscriptionTierConfig");
const Client = require("../models/Client");

// Default fallback configuration in case DB tiers haven't been seeded yet
const DEFAULT_TIERS = {
  starter: {
    tierKey: "starter",
    displayName: "Starter Practice",
    caps: { activeClients: 5, monthlySessions: 20 },
    featureFlags: {
      clinicalNotes: true,
      noteTemplates: ["freeform"],
      analyticsDepth: "basic",
      packageManagement: false,
      customBranding: false,
      realtimeChat: false,
      exportReports: false,
    },
  },
  pro: {
    tierKey: "pro",
    displayName: "Professional Practice",
    caps: { activeClients: 25, monthlySessions: 100 },
    featureFlags: {
      clinicalNotes: true,
      noteTemplates: ["freeform", "SOAP"],
      analyticsDepth: "advanced",
      packageManagement: true,
      customBranding: true,
      realtimeChat: true,
      exportReports: false,
    },
  },
  enterprise: {
    tierKey: "enterprise",
    displayName: "Unlimited Clinic",
    caps: { activeClients: -1, monthlySessions: -1 },
    featureFlags: {
      clinicalNotes: true,
      noteTemplates: ["freeform", "SOAP", "DAP"],
      analyticsDepth: "comprehensive",
      packageManagement: true,
      customBranding: true,
      realtimeChat: true,
      exportReports: true,
    },
  },
};

/**
 * Ensure default subscription tiers exist in MongoDB
 */
const seedDefaultTiersIfEmpty = async () => {
  try {
    const count = await SubscriptionTierConfig.countDocuments();
    if (count === 0) {
      await SubscriptionTierConfig.insertMany([
        {
          ...DEFAULT_TIERS.starter,
          priceMonthly: 999,
          priceYearly: 9990,
        },
        {
          ...DEFAULT_TIERS.pro,
          priceMonthly: 2499,
          priceYearly: 24990,
        },
        {
          ...DEFAULT_TIERS.enterprise,
          priceMonthly: 4999,
          priceYearly: 49990,
        },
      ]);
    }
  } catch (err) {
    console.error("Failed to seed subscription tiers:", err.message);
  }
};

/**
 * Get the full entitlement profile for a given therapist.
 */
const getTherapistEntitlements = async (therapistId) => {
  const therapist = await Therapist.findById(therapistId);
  if (!therapist) {
    throw new Error("Therapist not found");
  }

  const tierKey = (therapist.subscriptionTier || "starter").toLowerCase();

  let tierConfig = await SubscriptionTierConfig.findOne({ tierKey, isActive: true });
  if (!tierConfig) {
    tierConfig = DEFAULT_TIERS[tierKey] || DEFAULT_TIERS.starter;
  }

  const currentActiveClients = await Client.countDocuments({
    therapist: therapistId,
    status: "Active",
  });

  const clientCap = tierConfig.caps?.activeClients ?? 5;
  const canAddMoreClients = clientCap === -1 || currentActiveClients < clientCap;

  return {
    tierKey,
    displayName: tierConfig.displayName,
    caps: tierConfig.caps,
    usage: {
      activeClients: currentActiveClients,
      clientCap,
      canAddMoreClients,
    },
    features: tierConfig.featureFlags,
  };
};

/**
 * Centralized feature access gate.
 * Single source of truth for the entire application.
 *
 * @param {string} therapistId
 * @param {string} featureKey e.g. "packageManagement", "realtimeChat", "noteTemplates:SOAP", "canAddClient"
 * @returns {Promise<{allowed: boolean, reason?: string, currentTier: string, requiredTier?: string}>}
 */
const canAccess = async (therapistId, featureKey) => {
  const entitlements = await getTherapistEntitlements(therapistId);

  // 1. Client Cap check
  if (featureKey === "canAddClient") {
    if (!entitlements.usage.canAddMoreClients) {
      return {
        allowed: false,
        reason: `Active client limit (${entitlements.usage.clientCap}) reached on ${entitlements.displayName}. Please upgrade your plan.`,
        currentTier: entitlements.tierKey,
        requiredTier: "pro",
      };
    }
    return { allowed: true, currentTier: entitlements.tierKey };
  }

  // 2. Note template check (e.g. "noteTemplates:SOAP" or "noteTemplates:DAP")
  if (featureKey.startsWith("noteTemplates:")) {
    const templateName = featureKey.split(":")[1];
    const allowedTemplates = entitlements.features?.noteTemplates || ["freeform"];
    const isAllowed = allowedTemplates.includes(templateName);
    return {
      allowed: isAllowed,
      reason: isAllowed
        ? undefined
        : `The ${templateName} template requires an upgraded subscription plan.`,
      currentTier: entitlements.tierKey,
      requiredTier: templateName === "DAP" ? "enterprise" : "pro",
    };
  }

  // 3. Analytics depth check (e.g. "analytics:advanced")
  if (featureKey.startsWith("analytics:")) {
    const requestedDepth = featureKey.split(":")[1];
    const currentDepth = entitlements.features?.analyticsDepth || "basic";

    const depthRanks = { basic: 1, advanced: 2, comprehensive: 3 };
    const isAllowed = (depthRanks[currentDepth] || 1) >= (depthRanks[requestedDepth] || 1);
    return {
      allowed: isAllowed,
      reason: isAllowed
        ? undefined
        : `Advanced practice analytics require a higher subscription tier.`,
      currentTier: entitlements.tierKey,
      requiredTier: "pro",
    };
  }

  // 4. Boolean feature flags
  const isFeatureAllowed = Boolean(entitlements.features?.[featureKey]);
  return {
    allowed: isFeatureAllowed,
    reason: isFeatureAllowed
      ? undefined
      : `Feature '${featureKey}' is not enabled on the ${entitlements.displayName} plan.`,
    currentTier: entitlements.tierKey,
    requiredTier: "pro",
  };
};

module.exports = {
  canAccess,
  getTherapistEntitlements,
  seedDefaultTiersIfEmpty,
};

