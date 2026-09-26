const mongoose = require("mongoose");

const therapistSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password_hash: {
      type: String,
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    bio: {
      type: String,
      default: "",
      trim: true,
    },

    specializations: {
      type: [String],
      default: [],
    },

    languages: {
      type: [String],
      default: [],
    },

    subscriptionTier: {
      type: String,
      default: "starter",
      lowercase: true,
      trim: true,
    },

    // New fields for multi-provider directory
    profileImage: {
      type: String,
      default: "",
    },

    experience: {
      type: Number,
      default: 0,
    },

    qualification: {
      type: String,
      default: "",
      trim: true,
    },

    consultationFee: {
      type: Number,
      default: 0,
    },

    isDemo: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Therapist", therapistSchema);