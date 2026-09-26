const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema(
  {
    therapist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Therapist",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    demographics: {
      age: { type: Number, min: 0, max: 120 },
      gender: { type: String, trim: true, default: "" },
      occupation: { type: String, trim: true, default: "" },
      location: { type: String, trim: true, default: "" },
      emergencyContact: {
        name: { type: String, default: "" },
        relationship: { type: String, default: "" },
        phone: { type: String, default: "" },
      },
    },

    presentingConcern: {
      type: String,
      trim: true,
      default: "",
    },

    history: {
      type: String,
      trim: true,
      default: "",
    },

    intakeCompleted: {
      type: Boolean,
      default: false,
    },

    consent: {
      agreed: { type: Boolean, default: false },
      timestamp: { type: Date },
      ipAddress: { type: String, default: "" },
    },

    status: {
      type: String,
      enum: ["Active", "Inactive", "Archived"],
      default: "Active",
    },

    tags: {
      type: [String],
      default: ["New Client"],
    },

    totalSessions: {
      type: Number,
      default: 0,
    },

    lastSession: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Client", clientSchema);

