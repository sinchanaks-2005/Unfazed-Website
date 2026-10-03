const Session = require("../models/Session");
const Therapist = require("../models/Therapist");
const Client = require("../models/Client");

const {
  notify24HourReminder,
  notifyPostSessionFollowUp,
} = require("./notificationService");

// Prevent duplicate notifications while the server is running
const processedNotifications = new Set();

const getNotificationKey = (type, sessionId) => {
  return `${type}_${sessionId.toString()}`;
};

// =====================================================
// 24-HOUR SESSION REMINDERS
// =====================================================

const process24HourReminders = async () => {
  try {
    const now = new Date();

    const twentyFourHoursFromNow = new Date(
      now.getTime() + 24 * 60 * 60 * 1000
    );

    // Small window around exactly 24 hours so the
    // scheduler does not need to run at the exact second.
    const windowStart = new Date(
      twentyFourHoursFromNow.getTime() - 60 * 1000
    );

    const windowEnd = new Date(
      twentyFourHoursFromNow.getTime() + 60 * 1000
    );

    const sessions = await Session.find({
      status: "booked",
      startTime: {
        $gte: windowStart,
        $lte: windowEnd,
      },
    })
      .populate("client", "name email phone")
      .populate("therapist", "name email");

    for (const session of sessions) {
      const key = getNotificationKey(
        "24hour",
        session._id
      );

      if (processedNotifications.has(key)) {
        continue;
      }

      const client = session.client;
      const therapist = session.therapist;

      if (!client || !therapist) {
        continue;
      }

      await notify24HourReminder({
        clientName: client.name,
        clientEmail: client.email,
        therapistName: therapist.name,
        sessionTime: new Date(
          session.startTime
        ).toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone:
            session.timezone || "Asia/Kolkata",
        }),
      });

      processedNotifications.add(key);

      console.log(
        `[NotificationScheduler] 24-hour reminder processed for session ${session._id}`
      );
    }
  } catch (error) {
    console.error(
      "24-hour reminder scheduler error:",
      error.message
    );
  }
};

// =====================================================
// POST-SESSION FOLLOW-UP
// =====================================================

const processPostSessionFollowUps = async () => {
  try {
    const now = new Date();

    const oneHourAgo = new Date(
      now.getTime() - 60 * 60 * 1000
    );

    const twoHoursAgo = new Date(
      now.getTime() - 2 * 60 * 60 * 1000
    );

    const sessions = await Session.find({
      status: "booked",
      endTime: {
        $gte: twoHoursAgo,
        $lte: oneHourAgo,
      },
    })
      .populate("client", "name email phone")
      .populate("therapist", "name email");

    for (const session of sessions) {
      const key = getNotificationKey(
        "followup",
        session._id
      );

      if (processedNotifications.has(key)) {
        continue;
      }

      const client = session.client;
      const therapist = session.therapist;

      if (!client || !therapist) {
        continue;
      }

      await notifyPostSessionFollowUp({
        clientName: client.name,
        clientEmail: client.email,
        therapistName: therapist.name,
      });

      processedNotifications.add(key);

      console.log(
        `[NotificationScheduler] Post-session follow-up processed for session ${session._id}`
      );
    }
  } catch (error) {
    console.error(
      "Post-session follow-up scheduler error:",
      error.message
    );
  }
};

// =====================================================
// START NOTIFICATION SCHEDULER
// =====================================================

const startNotificationScheduler = () => {
  console.log(
    "[NotificationScheduler] Started."
  );

  // Run once when the server starts
  process24HourReminders();
  processPostSessionFollowUps();

  // Check every minute
  setInterval(() => {
    process24HourReminders();
    processPostSessionFollowUps();
  }, 60 * 1000);
};

module.exports = {
  startNotificationScheduler,
};