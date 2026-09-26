/**
 * UNFAZED — Seed 15 Demo Therapists/Doctors
 *
 * Run once: node src/utils/seedTherapists.js
 *
 * Rules:
 * - Never deletes existing real accounts
 * - Uses unique emails (dr.xxx@demo.unfazed)
 * - Skips creation if slug already exists (idempotent)
 * - Creates availability for each seeded therapist
 */

require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Therapist = require("../models/Therapist");
const Availability = require("../models/Availability");

const connectDB = require("../config/db");

// ==========================================
// DEMO THERAPIST DATA
// ==========================================

const DEMO_THERAPISTS = [
  {
    name: "Dr. Ananya Sharma",
    slug: "dr-ananya-sharma",
    email: "dr.ananya.sharma@demo.unfazed",
    specializations: ["Gynecologist"],
    bio: "Dr. Ananya Sharma is a dedicated gynecologist with 12 years of experience in women's health, fertility, and reproductive medicine. She provides compassionate care with a holistic approach.",
    languages: ["English", "Hindi", "Kannada"],
    experience: 12,
    qualification: "MBBS, MD (Obstetrics & Gynaecology), FRCOG",
    consultationFee: 800,
    profileImage: "https://ui-avatars.com/api/?name=Ananya+Sharma&background=7C3AED&color=fff&size=200",
  },
  {
    name: "Dr. Priya Mehta",
    slug: "dr-priya-mehta",
    email: "dr.priya.mehta@demo.unfazed",
    specializations: ["Dermatologist"],
    bio: "Dr. Priya Mehta specializes in medical and cosmetic dermatology. With 9 years of clinical experience, she treats acne, eczema, psoriasis, and offers advanced skin care consultations.",
    languages: ["English", "Hindi", "Gujarati"],
    experience: 9,
    qualification: "MBBS, MD (Dermatology, Venereology & Leprosy)",
    consultationFee: 700,
    profileImage: "https://ui-avatars.com/api/?name=Priya+Mehta&background=2563EB&color=fff&size=200",
  },
  {
    name: "Dr. Rajesh Kumar",
    slug: "dr-rajesh-kumar",
    email: "dr.rajesh.kumar@demo.unfazed",
    specializations: ["Cardiologist"],
    bio: "Dr. Rajesh Kumar is an interventional cardiologist with over 15 years of expertise in heart disease prevention, diagnosis, and treatment. He has performed thousands of successful cardiac interventions.",
    languages: ["English", "Hindi", "Tamil"],
    experience: 15,
    qualification: "MBBS, MD (Medicine), DM (Cardiology), FESC",
    consultationFee: 1200,
    profileImage: "https://ui-avatars.com/api/?name=Rajesh+Kumar&background=DC2626&color=fff&size=200",
  },
  {
    name: "Dr. Sunita Nair",
    slug: "dr-sunita-nair",
    email: "dr.sunita.nair@demo.unfazed",
    specializations: ["Pediatrician"],
    bio: "Dr. Sunita Nair is a warm and experienced pediatrician dedicated to child health and development. With 11 years of experience, she offers care for newborns through adolescents.",
    languages: ["English", "Malayalam", "Hindi"],
    experience: 11,
    qualification: "MBBS, MD (Pediatrics), Fellowship in Neonatology",
    consultationFee: 600,
    profileImage: "https://ui-avatars.com/api/?name=Sunita+Nair&background=059669&color=fff&size=200",
  },
  {
    name: "Dr. Vikram Rao",
    slug: "dr-vikram-rao",
    email: "dr.vikram.rao@demo.unfazed",
    specializations: ["Neurologist"],
    bio: "Dr. Vikram Rao is a leading neurologist specializing in headaches, epilepsy, stroke, and movement disorders. He brings 14 years of experience and a research-driven approach to patient care.",
    languages: ["English", "Hindi", "Telugu"],
    experience: 14,
    qualification: "MBBS, MD (Medicine), DM (Neurology)",
    consultationFee: 1100,
    profileImage: "https://ui-avatars.com/api/?name=Vikram+Rao&background=7C3AED&color=fff&size=200",
  },
  {
    name: "Dr. Arun Patel",
    slug: "dr-arun-patel",
    email: "dr.arun.patel@demo.unfazed",
    specializations: ["Orthopedic Specialist"],
    bio: "Dr. Arun Patel is an orthopedic surgeon with 13 years of experience in joint replacement, sports injuries, and spine care. He is known for his minimally invasive surgical techniques.",
    languages: ["English", "Hindi", "Gujarati"],
    experience: 13,
    qualification: "MBBS, MS (Orthopedics), Fellowship in Joint Replacement",
    consultationFee: 900,
    profileImage: "https://ui-avatars.com/api/?name=Arun+Patel&background=D97706&color=fff&size=200",
  },
  {
    name: "Dr. Kavitha Reddy",
    slug: "dr-kavitha-reddy",
    email: "dr.kavitha.reddy@demo.unfazed",
    specializations: ["General Physician"],
    bio: "Dr. Kavitha Reddy is a compassionate general physician with 8 years of experience in managing acute and chronic illnesses, preventive health, and family medicine.",
    languages: ["English", "Telugu", "Hindi", "Kannada"],
    experience: 8,
    qualification: "MBBS, MD (General Medicine)",
    consultationFee: 500,
    profileImage: "https://ui-avatars.com/api/?name=Kavitha+Reddy&background=0891B2&color=fff&size=200",
  },
  {
    name: "Dr. Suresh Iyer",
    slug: "dr-suresh-iyer",
    email: "dr.suresh.iyer@demo.unfazed",
    specializations: ["ENT Specialist"],
    bio: "Dr. Suresh Iyer is an ENT specialist with 10 years of experience treating disorders of the ear, nose, and throat. He specializes in hearing loss, sinus problems, and voice disorders.",
    languages: ["English", "Tamil", "Hindi"],
    experience: 10,
    qualification: "MBBS, MS (ENT), Fellowship in Head & Neck Surgery",
    consultationFee: 700,
    profileImage: "https://ui-avatars.com/api/?name=Suresh+Iyer&background=BE185D&color=fff&size=200",
  },
  {
    name: "Dr. Meera Joshi",
    slug: "dr-meera-joshi",
    email: "dr.meera.joshi@demo.unfazed",
    specializations: ["Ophthalmologist"],
    bio: "Dr. Meera Joshi is an experienced ophthalmologist offering comprehensive eye care. With 7 years of practice, she specializes in cataract surgery, glaucoma, and refractive errors.",
    languages: ["English", "Marathi", "Hindi"],
    experience: 7,
    qualification: "MBBS, MS (Ophthalmology), FICO",
    consultationFee: 650,
    profileImage: "https://ui-avatars.com/api/?name=Meera+Joshi&background=0369A1&color=fff&size=200",
  },
  {
    name: "Dr. Rahul Gupta",
    slug: "dr-rahul-gupta",
    email: "dr.rahul.gupta@demo.unfazed",
    specializations: ["Psychiatrist"],
    bio: "Dr. Rahul Gupta is a board-certified psychiatrist with 12 years of experience treating depression, anxiety, bipolar disorder, and schizophrenia. He combines medication management with psychotherapeutic support.",
    languages: ["English", "Hindi", "Punjabi"],
    experience: 12,
    qualification: "MBBS, MD (Psychiatry), DNB",
    consultationFee: 1000,
    profileImage: "https://ui-avatars.com/api/?name=Rahul+Gupta&background=7C3AED&color=fff&size=200",
  },
  {
    name: "Dr. Lakshmi Krishnan",
    slug: "dr-lakshmi-krishnan",
    email: "dr.lakshmi.krishnan@demo.unfazed",
    specializations: ["Psychologist"],
    bio: "Dr. Lakshmi Krishnan is a licensed clinical psychologist with 9 years of experience in cognitive-behavioural therapy, relationship counselling, and trauma-informed care.",
    languages: ["English", "Tamil", "Hindi", "Malayalam"],
    experience: 9,
    qualification: "MSc (Psychology), M.Phil (Clinical Psychology), PhD",
    consultationFee: 800,
    profileImage: "https://ui-avatars.com/api/?name=Lakshmi+Krishnan&background=059669&color=fff&size=200",
  },
  {
    name: "Dr. Nikhil Shah",
    slug: "dr-nikhil-shah",
    email: "dr.nikhil.shah@demo.unfazed",
    specializations: ["Dentist"],
    bio: "Dr. Nikhil Shah is a dentist with 6 years of experience offering comprehensive dental care including cosmetic dentistry, orthodontics, implants, and preventive treatment.",
    languages: ["English", "Hindi", "Gujarati"],
    experience: 6,
    qualification: "BDS, MDS (Prosthodontics)",
    consultationFee: 400,
    profileImage: "https://ui-avatars.com/api/?name=Nikhil+Shah&background=0891B2&color=fff&size=200",
  },
  {
    name: "Dr. Pooja Verma",
    slug: "dr-pooja-verma",
    email: "dr.pooja.verma@demo.unfazed",
    specializations: ["Gastroenterologist"],
    bio: "Dr. Pooja Verma is a gastroenterologist with 10 years of expertise in digestive health, liver disease, IBS, Crohn's disease, and advanced endoscopic procedures.",
    languages: ["English", "Hindi", "Bengali"],
    experience: 10,
    qualification: "MBBS, MD (Medicine), DM (Gastroenterology)",
    consultationFee: 950,
    profileImage: "https://ui-avatars.com/api/?name=Pooja+Verma&background=DC2626&color=fff&size=200",
  },
  {
    name: "Dr. Sanjay Bhat",
    slug: "dr-sanjay-bhat",
    email: "dr.sanjay.bhat@demo.unfazed",
    specializations: ["Endocrinologist"],
    bio: "Dr. Sanjay Bhat specializes in hormonal disorders including diabetes, thyroid disease, and metabolic conditions. With 11 years of experience, he offers evidence-based endocrine care.",
    languages: ["English", "Kannada", "Hindi", "Tulu"],
    experience: 11,
    qualification: "MBBS, MD (Medicine), DM (Endocrinology)",
    consultationFee: 1000,
    profileImage: "https://ui-avatars.com/api/?name=Sanjay+Bhat&background=D97706&color=fff&size=200",
  },
  {
    name: "Dr. Deepa Menon",
    slug: "dr-deepa-menon",
    email: "dr.deepa.menon@demo.unfazed",
    specializations: ["Pulmonologist"],
    bio: "Dr. Deepa Menon is a pulmonologist with 8 years of experience treating respiratory conditions such as asthma, COPD, sleep apnoea, and lung infections.",
    languages: ["English", "Malayalam", "Hindi"],
    experience: 8,
    qualification: "MBBS, MD (Respiratory Medicine), FCCP",
    consultationFee: 850,
    profileImage: "https://ui-avatars.com/api/?name=Deepa+Menon&background=2563EB&color=fff&size=200",
  },
];

// Default availability for all demo doctors: Mon-Fri 09:00-17:00, 60min sessions, 15min buffer
const DEFAULT_WEEKLY_SCHEDULE = [
  { dayOfWeek: 1, startTime: "09:00", endTime: "17:00", enabled: true }, // Monday
  { dayOfWeek: 2, startTime: "09:00", endTime: "17:00", enabled: true }, // Tuesday
  { dayOfWeek: 3, startTime: "09:00", endTime: "17:00", enabled: true }, // Wednesday
  { dayOfWeek: 4, startTime: "09:00", endTime: "17:00", enabled: true }, // Thursday
  { dayOfWeek: 5, startTime: "09:00", endTime: "17:00", enabled: true }, // Friday
  { dayOfWeek: 0, startTime: "09:00", endTime: "13:00", enabled: false }, // Sunday (off)
  { dayOfWeek: 6, startTime: "09:00", endTime: "13:00", enabled: false }, // Saturday (off)
];

// ==========================================
// SEED FUNCTION
// ==========================================

async function seedTherapists() {
  await connectDB();
  console.log("🌱 Starting demo therapist seeding...\n");

  const password_hash = await bcrypt.hash("Demo@Unfazed2026", 10);

  let created = 0;
  let skipped = 0;

  for (const demo of DEMO_THERAPISTS) {
    try {
      // Check if slug or email already exists — skip if so
      const existing = await Therapist.findOne({
        $or: [{ slug: demo.slug }, { email: demo.email }],
      });

      if (existing) {
        console.log(`⏭  Skipping ${demo.name} — already exists (slug: ${demo.slug})`);
        skipped++;
        continue;
      }

      // Create therapist
      const therapist = await Therapist.create({
        name: demo.name,
        slug: demo.slug,
        email: demo.email,
        password_hash,
        bio: demo.bio,
        specializations: demo.specializations,
        languages: demo.languages,
        experience: demo.experience,
        qualification: demo.qualification,
        consultationFee: demo.consultationFee,
        profileImage: demo.profileImage,
        subscriptionTier: "pro",
        isDemo: true,
      });

      // Create availability for this therapist
      const existingAvailability = await Availability.findOne({
        therapist: therapist._id,
      });

      if (!existingAvailability) {
        await Availability.create({
          therapist: therapist._id,
          timezone: "Asia/Kolkata",
          weeklySchedule: DEFAULT_WEEKLY_SCHEDULE,
          sessionDuration: 60,
          bufferMinutes: 15,
          overrides: [],
          blockedSlots: [],
        });
      }

      console.log(`✅ Created: ${demo.name} (${demo.specializations[0]}) — slug: ${demo.slug}`);
      created++;
    } catch (err) {
      console.error(`❌ Error creating ${demo.name}:`, err.message);
    }
  }

  console.log(`\n📊 Seeding complete: ${created} created, ${skipped} skipped`);
  console.log("🔑 Demo password for all seeded doctors: Demo@Unfazed2026");
  process.exit(0);
}

seedTherapists().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

