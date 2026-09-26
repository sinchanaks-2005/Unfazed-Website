const nodemailer = require("nodemailer");

// Notification event queue
const notificationLogQueue = [];

// Optional Nodemailer transporter (uses Ethereal/test or environment SMTP)
let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/**
 * Dispatch an email notification. Falls back to mock logging if SMTP not configured.
 */
const sendEmail = async ({ to, subject, html, text }) => {
  const eventRecord = {
    channel: "email",
    to,
    subject,
    timestamp: new Date().toISOString(),
    status: "queued",
  };

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: '"UNFAZED Support" <notifications@unfazed.in>',
        to,
        subject,
        text,
        html,
      });
      eventRecord.status = "sent";
      eventRecord.messageId = info.messageId;
    } catch (err) {
      console.error("Nodemailer send failed:", err.message);
      eventRecord.status = "failed";
      eventRecord.error = err.message;
    }
  } else {
    // Development / test stub mode
    eventRecord.status = "logged_dev_mode";
  }

  notificationLogQueue.push(eventRecord);
  return eventRecord;
};

/**
 * WhatsApp Business API stub that queues and logs events.
 * (Spec 4.4: External integrations must be isolated behind services/interfaces so they can be stubbed)
 */
const sendWhatsApp = async ({ phone, templateName, parameters }) => {
  const eventRecord = {
    channel: "whatsapp",
    phone,
    templateName,
    parameters,
    timestamp: new Date().toISOString(),
    status: "stub_dispatched",
  };

  notificationLogQueue.push(eventRecord);
  return eventRecord;
};

/**
 * High-level domain event handlers
 */
const notifyBookingConfirmed = async ({
  clientName,
  clientEmail,
  clientPhone,
  therapistName,
  sessionTime,
}) => {
  // 1. Email confirmation to client
  await sendEmail({
    to: clientEmail,
    subject: `Booking Confirmed with ${therapistName} | UNFAZED`,
    text: `Hello ${clientName},\n\nYour session with ${therapistName} is confirmed for ${sessionTime}.\n\nThank you,\nUNFAZED`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; color: #303047;">
        <h2 style="color: #6e60d5;">Session Confirmed!</h2>
        <p>Dear <strong>${clientName}</strong>,</p>
        <p>Your appointment with <strong>${therapistName}</strong> has been successfully booked.</p>
        <p><strong>Scheduled Time:</strong> ${sessionTime}</p>
        <hr style="border: none; border-top: 1px solid #e8e9f2; margin: 20px 0;" />
        <p style="font-size: 12px; color: #888;">UNFAZED Healthcare Platform</p>
      </div>
    `,
  });

  // 2. WhatsApp notification stub
  if (clientPhone) {
    await sendWhatsApp({
      phone: clientPhone,
      templateName: "booking_confirmation",
      parameters: { clientName, therapistName, sessionTime },
    });
  }
};

const notify24HourReminder = async ({
  clientName,
  clientEmail,
  therapistName,
  sessionTime,
}) => {
  await sendEmail({
    to: clientEmail,
    subject: `Reminder: Your session with ${therapistName} is tomorrow`,
    text: `Hi ${clientName}, this is a gentle reminder that your session with ${therapistName} is tomorrow at ${sessionTime}.`,
    html: `<p>Hi <strong>${clientName}</strong>, your session with <strong>${therapistName}</strong> is scheduled for tomorrow at ${sessionTime}.</p>`,
  });
};

const notifyPostSessionFollowUp = async ({
  clientName,
  clientEmail,
  therapistName,
}) => {
  await sendEmail({
    to: clientEmail,
    subject: `Following up on your session with ${therapistName}`,
    text: `Hi ${clientName}, we hope your session with ${therapistName} was helpful. Shared notes and resources are available in your portal.`,
    html: `<p>Hi <strong>${clientName}</strong>, you can review any notes shared by <strong>${therapistName}</strong> in your client portal.</p>`,
  });
};

const getRecentNotificationLogs = () => {
  return [...notificationLogQueue].reverse().slice(0, 50);
};

module.exports = {
  sendEmail,
  sendWhatsApp,
  notifyBookingConfirmed,
  notify24HourReminder,
  notifyPostSessionFollowUp,
  getRecentNotificationLogs,
};

