const mongoose = require("mongoose");

const subscriptionTierConfigSchema = new mongoose.Schema(
  {
    tierKey: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    displayName: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      default: "",
    },

    priceMonthly: {
      type: Number,
      required: true,
      min: 0,
    },

    priceYearly: {
      type: Number,
      required: true,
      min: 0,
    },

    caps: {
      activeClients: {
        type: Number, // -1 means unlimited
        required: true,
        default: 5,
      },
      monthlySessions: {
        type: Number, // -1 means unlimited
        required: true,
        default: 20,
      },
    },

    featureFlags: {
      clinicalNotes: {
        type: Boolean,
        default: true,
      },
      noteTemplates: {
        type: [String], // ["freeform"], ["freeform", "SOAP"], ["freeform", "SOAP", "DAP"]
        default: ["freeform"],
      },
      analyticsDepth: {
        type: String, // "basic", "advanced", "comprehensive"
        enum: ["basic", "advanced", "comprehensive"],
        default: "basic",
      },
      packageManagement: {
        type: Boolean,
        default: false,
      },
      customBranding: {
        type: Boolean,
        default: false,
      },
      realtimeChat: {
        type: Boolean,
        default: false,
      },
      exportReports: {
        type: Boolean,
        default: false,
      },
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "SubscriptionTierConfig",
  subscriptionTierConfigSchema
);

