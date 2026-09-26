require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Therapist = require("../models/Therapist");
const Availability = require("../models/Availability");
const Client = require("../models/Client");
const Session = require("../models/Session");
const SessionNote = require("../models/SessionNote");
const Payment = require("../models/Payment");
const Package = require("../models/Package");
const ClientPackage = require("../models/ClientPackage");
const SubscriptionTierConfig = require("../models/SubscriptionTierConfig");
const { seedDefaultTiersIfEmpty } = require("../services/entitlementService");

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for seeding...");

    // 1. Seed Subscription Tiers
    await seedDefaultTiersIfEmpty();

    // 2. Ensure Dr. Sharma exists
    let drSharma = await Therapist.findOne({ slug: "dr-sharma" });
    const pwHash = await bcrypt.hash("Password123!", 10);

    if (!drSharma) {
      drSharma = await Therapist.create({
        name: "Dr. Ananya Sharma",
        email: "dr.sharma@unfazed.in",
        password_hash: pwHash,
        slug: "dr-sharma",
        bio: "Senior Clinical Psychologist with 10+ years of experience specializing in Cognitive Behavioral Therapy (CBT), anxiety, depression, and relationship counseling.",
        specializations: ["Cognitive Behavioral Therapy (CBT)", "Anxiety & Panic", "Depression", "Relationship Dynamics"],
        languages: ["English", "Hindi"],
        subscriptionTier: "pro",
      });
      console.log("Seeded Dr. Sharma:", drSharma._id);
    }

    // Also update existing Sinchana KS to pro tier for testing
    const sinchana = await Therapist.findOne({ slug: "sinchana-ks" });
    if (sinchana) {
      sinchana.subscriptionTier = "pro";
      await sinchana.save();
    }

    const therapistTarget = drSharma;

    // 3. Availability for Dr. Sharma
    let avail = await Availability.findOne({ therapist: therapistTarget._id });
    if (!avail) {
      await Availability.create({
        therapist: therapistTarget._id,
        timezone: "Asia/Kolkata",
        sessionDuration: 60,
        bufferMinutes: 15,
        weeklySchedule: [1, 2, 3, 4, 5].map((day) => ({
          dayOfWeek: day,
          enabled: true,
          startTime: "09:00",
          endTime: "18:00",
        })),
      });
      console.log("Seeded availability for Dr. Sharma");
    }

    // 4. Seed Clients
    const clientData = [
      {
        name: "Aarav Patel",
        email: "aarav.patel@example.com",
        phone: "+91 98201 12345",
        demographics: { age: 29, gender: "Male", occupation: "Software Engineer", location: "Bangalore" },
        presentingConcern: "Workplace burnout, persistent anxiety, sleep disturbances.",
        intakeCompleted: true,
        consent: { agreed: true, timestamp: new Date(Date.now() - 30 * 86400000), ipAddress: "127.0.0.1" },
        status: "Active",
        tags: ["Anxiety", "CBT"],
        totalSessions: 4,
        lastSession: new Date(Date.now() - 3 * 86400000),
      },
      {
        name: "Meera Sen",
        email: "meera.sen@example.com",
        phone: "+91 98450 54321",
        demographics: { age: 34, gender: "Female", occupation: "Architect", location: "Mumbai" },
        presentingConcern: "Relationship conflict, emotional regulation, boundary setting.",
        intakeCompleted: true,
        consent: { agreed: true, timestamp: new Date(Date.now() - 45 * 86400000), ipAddress: "127.0.0.1" },
        status: "Active",
        tags: ["Relationships", "Self-Esteem"],
        totalSessions: 6,
        lastSession: new Date(Date.now() - 7 * 86400000),
      },
      {
        name: "Rohan Kapoor",
        email: "rohan.k@example.com",
        phone: "+91 98110 98765",
        demographics: { age: 24, gender: "Male", occupation: "Graduate Student", location: "Delhi" },
        presentingConcern: "Academic performance anxiety, social hesitation.",
        intakeCompleted: true,
        consent: { agreed: true, timestamp: new Date(Date.now() - 10 * 86400000), ipAddress: "127.0.0.1" },
        status: "Active",
        tags: ["Students", "Social Anxiety"],
        totalSessions: 2,
        lastSession: new Date(Date.now() - 2 * 86400000),
      },
    ];

    const seededClients = [];
    for (const c of clientData) {
      let client = await Client.findOne({ therapist: therapistTarget._id, email: c.email });
      if (!client) {
        client = await Client.create({ ...c, therapist: therapistTarget._id });
        console.log("Seeded client:", client.name);
      }
      seededClients.push(client);
    }

    // 5. Seed Packages
    let pkg = await Package.findOne({ therapist: therapistTarget._id, sessionCount: 6 });
    if (!pkg) {
      pkg = await Package.create({
        therapist: therapistTarget._id,
        name: "Wellness Journey (6 Sessions)",
        description: "6 comprehensive 60-minute therapy sessions with dedicated support and shared homework.",
        sessionCount: 6,
        totalPrice: 9000,
        perSessionRate: 1500,
        validityDays: 90,
      });
      console.log("Seeded Package:", pkg.name);
    }

    // 6. Seed Clinical Notes (SOAP + Shared Note)
    const noteCount = await SessionNote.countDocuments({ therapist: therapistTarget._id });
    if (noteCount === 0 && seededClients.length > 0) {
      await SessionNote.create([
        {
          therapist: therapistTarget._id,
          client: seededClients[0]._id,
          type: "private",
          template: "SOAP",
          title: "Session 4 - CBT Progress Review",
          content: "<p>Client shows notable progress in identifying automatic negative thoughts during work sprints.</p>",
          soapData: {
            subjective: "Client reports feeling 40% less overwhelmed by project deadlines.",
            objective: "Engaged in cognitive reframing exercise smoothly. Heart rate steady.",
            assessment: "Generalized Anxiety Disorder symptoms mild-to-moderate; responsive to CBT.",
            plan: "Continue thought record diary; practice 4-7-8 breathing twice daily.",
          },
        },
        {
          therapist: therapistTarget._id,
          client: seededClients[0]._id,
          type: "shared",
          template: "freeform",
          title: "Takeaway & Action Plan for Aarav",
          content: "<p><strong>Key Insight:</strong> Thoughts are hypotheses, not facts.</p><p><strong>Home Practice:</strong> Spend 5 minutes before logging on writing down 3 things you can control today.</p>",
          sharedWithClientAt: new Date(),
        },
      ]);
      console.log("Seeded Clinical Notes (Private & Shared).");
    }

    // 7. Seed Payments
    const payCount = await Payment.countDocuments({ therapist: therapistTarget._id });
    if (payCount === 0 && seededClients.length > 0) {
      await Payment.create([
        {
          therapist: therapistTarget._id,
          client: seededClients[0]._id,
          amount: 2000,
          platform_fee: 100,
          net_amount: 1900,
          status: "completed",
          gateway_transaction_id: "pay_demo_101",
          invoice_number: "INV-10001",
        },
        {
          therapist: therapistTarget._id,
          client: seededClients[1]._id,
          amount: 9000,
          platform_fee: 450,
          net_amount: 8550,
          package: pkg ? pkg._id : null,
          status: "completed",
          gateway_transaction_id: "pay_demo_102",
          invoice_number: "INV-10002",
        },
      ]);
      console.log("Seeded Payments.");
    }

    console.log("Seeding complete! You can log in with: dr.sharma@unfazed.in / Password123!");
    await mongoose.disconnect();
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
}

seed();

