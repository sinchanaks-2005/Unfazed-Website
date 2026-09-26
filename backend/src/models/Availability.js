const mongoose = require("mongoose");

const weeklyAvailabilitySchema = new mongoose.Schema(
  {
    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 6,
    },

    enabled: {
      type: Boolean,
      default: false,
    },

    startTime: {
      type: String,
      default: "09:00",
    },

    endTime: {
      type: String,
      default: "17:00",
    },
  },
  {
    _id: false,
  }
);

const availabilitySchema = new mongoose.Schema(
  {
    therapist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Therapist",
      required: true,
      unique: true,
    },

    // Therapist timezone
    timezone: {
      type: String,
      default: "Asia/Kolkata",
    },

    // Recurring weekly schedule
    weeklySchedule: {
      type: [weeklyAvailabilitySchema],
      default: [],
    },

    // One-time availability changes
    overrides: [
      {
        date: {
          type: String,
          required: true,
        },

        type: {
          type: String,
          enum: ["available", "blocked"],
          required: true,
        },

        startTime: {
          type: String,
          required: true,
        },

        endTime: {
          type: String,
          required: true,
        },
      },
    ],

    // Specific blocked periods
    blockedSlots: [
      {
        start: {
          type: Date,
          required: true,
        },

        end: {
          type: Date,
          required: true,
        },

        reason: {
          type: String,
          default: "",
        },
      },
    ],

    // Duration of ONE client session
    sessionDuration: {
      type: Number,
      enum: [30, 45, 60, 90],
      default: 60,
    },

    // Break between client sessions
    bufferMinutes: {
      type: Number,
      enum: [0, 5, 10, 15, 30],
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Availability",
  availabilitySchema
);