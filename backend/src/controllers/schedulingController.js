const Availability = require("../models/Availability");
const Session = require("../models/Session");
const Client = require("../models/Client");
const { addMinutes } = require("date-fns");

// =====================================================
// TIMEZONE HELPERS
// =====================================================

const getTimeZoneParts = (date, timeZone) => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(date);
  const values = {};

  parts.forEach((part) => {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  });

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  };
};

const zonedTimeToUtc = (dateString, timeString, timeZone) => {
  const [year, month, day] = dateString.split("-").map(Number);
  const [hour, minute] = timeString.split(":").map(Number);

  const wallClockAsUtc = Date.UTC(
    year,
    month - 1,
    day,
    hour,
    minute,
    0
  );

  let utcDate = new Date(wallClockAsUtc);

  for (let i = 0; i < 3; i++) {
    const parts = getTimeZoneParts(utcDate, timeZone);

    const asUtc = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second
    );

    const difference = wallClockAsUtc - asUtc;
    utcDate = new Date(utcDate.getTime() + difference);
  }

  return utcDate;
};

const getDateStringInTimezone = (date, timeZone) => {
  const parts = getTimeZoneParts(date, timeZone);

  return [
    parts.year,
    String(parts.month).padStart(2, "0"),
    String(parts.day).padStart(2, "0"),
  ].join("-");
};

const getDayOfWeekInTimezone = (date, timeZone) => {
  const dateString = getDateStringInTimezone(date, timeZone);
  const [year, month, day] = dateString.split("-").map(Number);

  return new Date(
    Date.UTC(year, month - 1, day)
  ).getUTCDay();
};

const isValidTimeString = (value) => {
  return (
    typeof value === "string" &&
    /^\d{2}:\d{2}$/.test(value) &&
    Number(value.substring(0, 2)) >= 0 &&
    Number(value.substring(0, 2)) <= 23 &&
    Number(value.substring(3, 5)) >= 0 &&
    Number(value.substring(3, 5)) <= 59
  );
};

const isValidDateString = (value) => {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
};

// =====================================================
// GET AVAILABILITY
// =====================================================

const getAvailability = async (req, res) => {
  try {
    const availability = await Availability.findOne({
      therapist: req.therapist._id,
    });

    if (!availability) {
      return res.status(200).json({
        availability: null,
      });
    }

    return res.status(200).json({
      availability,
    });
  } catch (error) {
    console.error(
      "Get availability error:",
      error.message
    );

    return res.status(500).json({
      message: "Server error while fetching availability",
    });
  }
};

// =====================================================
// UPDATE AVAILABILITY
// =====================================================

const updateAvailability = async (req, res) => {
  try {
    const {
      timezone,
      weeklySchedule,
      overrides,
      blockedSlots,
      bufferMinutes,
      sessionDuration,
    } = req.body;

    const validDurations = [30, 45, 60, 90];
    const validBuffers = [0, 5, 10, 15, 30];

    if (
      sessionDuration !== undefined &&
      !validDurations.includes(Number(sessionDuration))
    ) {
      return res.status(400).json({
        message:
          "Session duration must be 30, 45, 60, or 90 minutes.",
      });
    }

    if (
      bufferMinutes !== undefined &&
      !validBuffers.includes(Number(bufferMinutes))
    ) {
      return res.status(400).json({
        message:
          "Buffer time must be 0, 5, 10, 15, or 30 minutes.",
      });
    }

    if (timezone !== undefined) {
      try {
        Intl.DateTimeFormat("en-US", {
          timeZone: timezone,
        });
      } catch {
        return res.status(400).json({
          message: "Invalid timezone.",
        });
      }
    }

    if (weeklySchedule !== undefined) {
      if (!Array.isArray(weeklySchedule)) {
        return res.status(400).json({
          message: "weeklySchedule must be an array.",
        });
      }

      for (const day of weeklySchedule) {
        if (
          typeof day.dayOfWeek !== "number" ||
          day.dayOfWeek < 0 ||
          day.dayOfWeek > 6
        ) {
          return res.status(400).json({
            message: "Invalid dayOfWeek in weeklySchedule.",
          });
        }

        if (
          day.enabled &&
          (!isValidTimeString(day.startTime) ||
            !isValidTimeString(day.endTime))
        ) {
          return res.status(400).json({
            message:
              "Invalid startTime or endTime in weeklySchedule.",
          });
        }
      }
    }

    let availability = await Availability.findOne({
      therapist: req.therapist._id,
    });

    if (!availability) {
      availability = new Availability({
        therapist: req.therapist._id,
      });
    }

    if (timezone !== undefined) {
      availability.timezone = timezone;
    }

    if (weeklySchedule !== undefined) {
      availability.weeklySchedule = weeklySchedule;
    }

    if (overrides !== undefined) {
      availability.overrides = overrides;
    }

    if (blockedSlots !== undefined) {
      availability.blockedSlots = blockedSlots;
    }

    if (bufferMinutes !== undefined) {
      availability.bufferMinutes = Number(bufferMinutes);
    }

    if (sessionDuration !== undefined) {
      availability.sessionDuration = Number(sessionDuration);
    }

    await availability.save();

    return res.status(200).json({
      message: "Availability updated successfully",
      availability,
    });
  } catch (error) {
    console.error(
      "Update availability error:",
      error.message
    );

    return res.status(500).json({
      message: "Server error while updating availability",
    });
  }
};

// =====================================================
// GET AVAILABLE SLOTS
// =====================================================

const getAvailableSlots = async (req, res) => {
  try {
    const { therapistId, date } = req.query;

    if (!therapistId || !date) {
      return res.status(400).json({
        message: "therapistId and date are required",
      });
    }

    if (!isValidDateString(date)) {
      return res.status(400).json({
        message: "Invalid date. Use YYYY-MM-DD.",
      });
    }

    const availability = await Availability.findOne({
      therapist: therapistId,
    });

    if (!availability) {
      return res.status(404).json({
        message: "Therapist availability not found",
      });
    }

    const timezone =
      availability.timezone || "Asia/Kolkata";

    const dayOfWeek = new Date(
      `${date}T00:00:00Z`
    ).getUTCDay();

    let schedule =
      availability.weeklySchedule.find(
        (item) => item.dayOfWeek === dayOfWeek
      );

    // ONE-TIME OVERRIDE
    const override = availability.overrides?.find(
      (item) => {
        const overrideDate =
          item.date instanceof Date
            ? item.date.toISOString().slice(0, 10)
            : String(item.date).slice(0, 10);

        return overrideDate === date;
      }
    );

    if (override) {
      if (override.type === "blocked") {
        return res.status(200).json({
          date,
          timezone,
          sessionDuration:
            availability.sessionDuration,
          bufferMinutes:
            availability.bufferMinutes,
          slots: [],
        });
      }

      schedule = {
        enabled: true,
        startTime: override.startTime,
        endTime: override.endTime,
      };
    }

    if (!schedule || !schedule.enabled) {
      return res.status(200).json({
        date,
        timezone,
        sessionDuration:
          availability.sessionDuration,
        bufferMinutes:
          availability.bufferMinutes,
        slots: [],
      });
    }

    if (
      !isValidTimeString(schedule.startTime) ||
      !isValidTimeString(schedule.endTime)
    ) {
      return res.status(500).json({
        message:
          "Therapist availability contains an invalid time.",
      });
    }

    const duration = availability.sessionDuration;
    const buffer = availability.bufferMinutes;

    if (!duration) {
      return res.status(500).json({
        message:
          "Therapist session duration is not configured.",
      });
    }

    const dayStart = zonedTimeToUtc(
      date,
      schedule.startTime,
      timezone
    );

    const dayEnd = zonedTimeToUtc(
      date,
      schedule.endTime,
      timezone
    );

    if (dayStart >= dayEnd) {
      return res.status(400).json({
        message:
          "Therapist availability start time must be before end time.",
      });
    }

    const slots = [];
    let currentStart = dayStart;

    const bookedSessions = await Session.find({
      therapist: therapistId,
      status: "booked",
      startTime: {
        $lt: dayEnd,
      },
      endTime: {
        $gt: dayStart,
      },
    });

    while (
      addMinutes(currentStart, duration) <= dayEnd
    ) {
      const currentEnd = addMinutes(
        currentStart,
        duration
      );

      const overlaps = bookedSessions.some(
        (session) =>
          currentStart < session.endTime &&
          currentEnd > session.startTime
      );

      const blocked =
        availability.blockedSlots?.some(
          (blockedSlot) =>
            currentStart <
              new Date(blockedSlot.end) &&
            currentEnd >
              new Date(blockedSlot.start)
        );

      if (!overlaps && !blocked) {
        slots.push({
          startTime:
            currentStart.toISOString(),
          endTime:
            currentEnd.toISOString(),
        });
      }

      currentStart = addMinutes(
        currentEnd,
        buffer
      );
    }

    return res.status(200).json({
      date,
      timezone,
      sessionDuration: duration,
      bufferMinutes: buffer,
      slots,
    });
  } catch (error) {
    console.error(
      "Get available slots error:",
      error.message
    );

    return res.status(500).json({
      message:
        "Server error while generating available slots",
    });
  }
};

// =====================================================
// BOOK SESSION
// =====================================================

const bookSession = async (req, res) => {
  try {
    const {
      therapistId,
      startTime,
      endTime,
      clientName,
      clientEmail,
      clientPhone,
      age,
      gender,
      occupation,
      location,
      presentingConcern,
      history,
      notes,
      consentAgreed,
      timezone,
    } = req.body;

    if (
      !therapistId ||
      !startTime ||
      !endTime ||
      !clientName ||
      !clientEmail
    ) {
      return res.status(400).json({
        message:
          "Therapist ID, start time, end time, client name, and client email are required.",
      });
    }

    if (!consentAgreed) {
      return res.status(400).json({
        message:
          "You must agree to the consent terms before booking.",
      });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      start >= end
    ) {
      return res.status(400).json({
        message: "Invalid start or end time.",
      });
    }

    // =================================================
    // GET AVAILABILITY
    // =================================================

    const availability = await Availability.findOne({
      therapist: therapistId,
    }).populate(
      "therapist",
      "name email slug"
    );

    if (!availability) {
      return res.status(404).json({
        message:
          "Therapist availability profile not found.",
      });
    }

    const therapistTimezone =
      availability.timezone || "Asia/Kolkata";

    const duration = Math.round(
      (end.getTime() - start.getTime()) /
        (1000 * 60)
    );

    // =================================================
    // VALIDATE SESSION DURATION
    // =================================================

    if (
      duration !==
      Number(availability.sessionDuration)
    ) {
      return res.status(400).json({
        message:
          "The selected slot does not match the therapist's session duration.",
      });
    }

    // =================================================
    // CONVERT REQUESTED UTC TIME TO THERAPIST LOCAL
    // =================================================

    const therapistLocalDate =
      getDateStringInTimezone(
        start,
        therapistTimezone
      );

    const therapistLocalDay =
      getDayOfWeekInTimezone(
        start,
        therapistTimezone
      );

    let schedule =
      availability.weeklySchedule.find(
        (item) =>
          item.dayOfWeek === therapistLocalDay
      );

    // =================================================
    // CHECK ONE-TIME OVERRIDE
    // =================================================

    const override =
      availability.overrides?.find(
        (item) => {
          const overrideDate =
            item.date instanceof Date
              ? item.date.toISOString().slice(0, 10)
              : String(item.date).slice(0, 10);

          return (
            overrideDate === therapistLocalDate
          );
        }
      );

    if (override) {
      if (override.type === "blocked") {
        return res.status(400).json({
          message:
            "The requested time is blocked by the therapist.",
        });
      }

      schedule = {
        enabled: true,
        startTime: override.startTime,
        endTime: override.endTime,
      };
    }

    if (!schedule || !schedule.enabled) {
      return res.status(400).json({
        message:
          "The requested time is outside the therapist's availability.",
      });
    }

    // =================================================
    // CHECK REQUESTED SLOT IS INSIDE WORKING HOURS
    // =================================================

    const scheduleStart = zonedTimeToUtc(
      therapistLocalDate,
      schedule.startTime,
      therapistTimezone
    );

    const scheduleEnd = zonedTimeToUtc(
      therapistLocalDate,
      schedule.endTime,
      therapistTimezone
    );

    if (
      start < scheduleStart ||
      end > scheduleEnd
    ) {
      return res.status(400).json({
        message:
          "The requested time is outside the therapist's availability.",
      });
    }

    // =================================================
    // CHECK BUFFER / SLOT ALIGNMENT
    // =================================================

    let slotCursor = scheduleStart;
    let isValidSlot = false;

    while (
      addMinutes(
        slotCursor,
        Number(availability.sessionDuration)
      ) <= scheduleEnd
    ) {
      const slotEnd = addMinutes(
        slotCursor,
        Number(availability.sessionDuration)
      );

      if (
        slotCursor.getTime() === start.getTime() &&
        slotEnd.getTime() === end.getTime()
      ) {
        isValidSlot = true;
        break;
      }

      slotCursor = addMinutes(
        slotEnd,
        Number(
          availability.bufferMinutes || 0
        )
      );
    }

    if (!isValidSlot) {
      return res.status(400).json({
        message:
          "The selected time is not a valid available slot.",
      });
    }

    // =================================================
    // CHECK BLOCKED SLOTS
    // =================================================

    const isBlocked =
      availability.blockedSlots?.some(
        (slot) => {
          const blockedStart = new Date(
            slot.start
          );

          const blockedEnd = new Date(
            slot.end
          );

          return (
            start < blockedEnd &&
            end > blockedStart
          );
        }
      );

    if (isBlocked) {
      return res.status(400).json({
        message:
          "The requested time slot is blocked by the therapist.",
      });
    }

    // =================================================
    // DOUBLE-BOOKING PREVENTION
    // =================================================

    const existingBooking =
      await Session.findOne({
        therapist: therapistId,
        status: "booked",
        startTime: {
          $lt: end,
        },
        endTime: {
          $gt: start,
        },
      });

    if (existingBooking) {
      return res.status(409).json({
        message:
          "This slot is no longer available. Please select another slot.",
      });
    }

    // =================================================
    // FIND OR CREATE CLIENT
    // =================================================

    const normalizedEmail =
      clientEmail.trim().toLowerCase();

    let client = await Client.findOne({
      therapist: therapistId,
      email: normalizedEmail,
    });

    const demographics = {};

    if (
      age !== undefined &&
      age !== null &&
      String(age).trim() !== ""
    ) {
      demographics.age = Number(age);
    }

    if (
      gender !== undefined &&
      String(gender).trim() !== ""
    ) {
      demographics.gender = String(gender).trim();
    }

    if (
      occupation !== undefined &&
      String(occupation).trim() !== ""
    ) {
      demographics.occupation =
        String(occupation).trim();
    }

    if (
      location !== undefined &&
      String(location).trim() !== ""
    ) {
      demographics.location =
        String(location).trim();
    }

    const clientIp =
      req.headers["x-forwarded-for"] ||
      req.socket.remoteAddress ||
      "127.0.0.1";

    if (!client) {
      client = await Client.create({
        therapist: therapistId,
        name: clientName.trim(),
        email: normalizedEmail,
        phone: (clientPhone || "").trim(),

        demographics,

        presentingConcern:
          (presentingConcern || "").trim(),

        history: (history || "").trim(),

        intakeCompleted: true,

        consent: {
          agreed: true,
          timestamp: new Date(),
          ipAddress: clientIp,
        },

        status: "Active",
        tags: ["New Client"],
      });
    } else {
      client.name = clientName.trim();

      if (clientPhone !== undefined) {
        client.phone =
          clientPhone.trim();
      }

      if (!client.status) {
        client.status = "Active";
      }

      client.demographics = {
        ...(client.demographics?.toObject
          ? client.demographics.toObject()
          : client.demographics || {}),
        ...demographics,
      };

      if (
        presentingConcern !== undefined
      ) {
        client.presentingConcern =
          presentingConcern.trim();
      }

      if (history !== undefined) {
        client.history =
          history.trim();
      }

      client.intakeCompleted = true;

      client.consent = {
        agreed: true,
        timestamp: new Date(),
        ipAddress: clientIp,
      };

      await client.save();
    }

    // =================================================
    // CREATE SESSION
    // =================================================

    const session = await Session.create({
      therapist: therapistId,
      client: client._id,
      clientName: client.name,
      clientEmail: client.email,
      clientPhone: client.phone || "",
      notes: (notes || "").trim(),
      startTime: start,
      endTime: end,
      duration,
      status: "booked",
      timezone:
        timezone ||
        therapistTimezone ||
        "Asia/Kolkata",
    });

    // =================================================
    // UPDATE CLIENT SESSION COUNT
    // =================================================

    client.totalSessions =
      (client.totalSessions || 0) + 1;

    client.lastSession = start;

    await client.save();

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(201).json({
      message: "Session booked successfully!",

      session: {
        id: session._id,
        therapist: availability.therapist,

        client: {
          id: client._id,
          name: client.name,
          email: client.email,
          phone: client.phone || "",

          demographics:
            client.demographics || {},

          presentingConcern:
            client.presentingConcern || "",

          history:
            client.history || "",

          intakeCompleted:
            client.intakeCompleted,

          consentAgreed:
            client.consent?.agreed || false,
        },

        clientName: session.clientName,
        clientEmail: session.clientEmail,
        clientPhone: session.clientPhone,
        startTime: session.startTime,
        endTime: session.endTime,
        duration: session.duration,
        status: session.status,
        timezone: session.timezone,
      },
    });
  } catch (error) {
    console.error(
      "Book session error:",
      error
    );

    return res.status(500).json({
      message:
        "Server error while booking session.",
    });
  }
};

// =====================================================
// GET THERAPIST SESSIONS
// =====================================================

const getSessions = async (req, res) => {
  try {
    const therapistId = req.therapist._id;
    const { tab } = req.query;

    const now = new Date();

    let query = {
      therapist: therapistId,
    };

    if (tab === "upcoming") {
      query.endTime = {
        $gt: now,
      };

      query.status = "booked";
    } else if (tab === "completed") {
      query.$or = [
        {
          endTime: {
            $lte: now,
          },
          status: "booked",
        },
        {
          status: "completed",
        },
      ];
    }

    const sessions = await Session.find(query)
      .populate(
        "client",
        "name email phone demographics presentingConcern history intakeCompleted consent status tags totalSessions lastSession"
      )
      .sort({
        startTime:
          tab === "completed" ? -1 : 1,
      })
      .lean();

    const enriched = sessions.map(
      (session) => {
        const isEnded =
          new Date(session.endTime) <= now;

        const derivedStatus =
          session.status === "cancelled"
            ? "cancelled"
            : isEnded
            ? "completed"
            : "upcoming";

        return {
          ...session,
          derivedStatus,
        };
      }
    );

    return res.status(200).json({
      sessions: enriched,
      total: enriched.length,
    });
  } catch (error) {
    console.error(
      "Get sessions error:",
      error.message
    );

    return res.status(500).json({
      message:
        "Server error while fetching sessions",
    });
  }
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  getAvailability,
  updateAvailability,
  getAvailableSlots,
  bookSession,
  getSessions,
};