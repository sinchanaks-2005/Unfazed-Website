import { useState, useEffect, useCallback } from "react";
import axiosInstance from "../api/axiosInstance";

export function useEntitlement() {
  const [entitlements, setEntitlements] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgradeModal, setUpgradeModal] = useState({
    isOpen: false,
    featureName: "",
    requiredTier: "pro",
    message: "",
  });

  const fetchEntitlements = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/analytics/entitlements");
      setEntitlements(res.data.entitlements);
    } catch (err) {
      console.warn("Could not load entitlements, using defaults:", err.message);
      // Fallback starter entitlements
      setEntitlements({
        tierKey: "starter",
        displayName: "Starter Practice",
        caps: { activeClients: 5 },
        usage: { activeClients: 0, clientCap: 5, canAddMoreClients: true },
        features: {
          noteTemplates: ["freeform"],
          analyticsDepth: "basic",
          packageManagement: false,
          realtimeChat: false,
        },
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchEntitlements();
    } else {
      setLoading(false);
    }
  }, [fetchEntitlements]);

  /**
   * Check if a feature is allowed.
   */
  const canAccess = (featureKey) => {
    if (!entitlements) return true;

    // Check client cap
    if (featureKey === "canAddClient") {
      return entitlements.usage?.canAddMoreClients ?? true;
    }

    // Check note template
    if (featureKey.startsWith("noteTemplates:")) {
      const template = featureKey.split(":")[1];
      const allowed = entitlements.features?.noteTemplates || ["freeform"];
      return allowed.includes(template);
    }

    // Check analytics depth
    if (featureKey.startsWith("analytics:")) {
      const depth = featureKey.split(":")[1];
      const current = entitlements.features?.analyticsDepth || "basic";
      const ranks = { basic: 1, advanced: 2, comprehensive: 3 };
      return (ranks[current] || 1) >= (ranks[depth] || 1);
    }

    // Generic boolean feature flag
    return Boolean(entitlements.features?.[featureKey]);
  };

  /**
   * Open the upgrade modal with helpful rationale.
   */
  const openUpgradeModal = (featureName, requiredTier = "pro", message = "") => {
    setUpgradeModal({
      isOpen: true,
      featureName,
      requiredTier,
      message:
        message ||
        `The ${featureName} feature requires an upgrade to the ${requiredTier.toUpperCase()} plan.`,
    });
  };

  const closeUpgradeModal = () => {
    setUpgradeModal((prev) => ({ ...prev, isOpen: false }));
  };

  return {
    entitlements,
    loading,
    canAccess,
    upgradeModal,
    openUpgradeModal,
    closeUpgradeModal,
    refreshEntitlements: fetchEntitlements,
  };
}

