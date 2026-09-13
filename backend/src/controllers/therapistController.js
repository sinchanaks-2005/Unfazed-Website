const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Therapist = require("../models/Therapist");

// ==========================================
// THERAPIST SIGNUP
// ==========================================

const signupTherapist = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    const existingTherapist = await Therapist.findOne({
      email: email.toLowerCase(),
    });

    if (existingTherapist) {
      return res.status(409).json({
        message: "Email already registered",
      });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const therapist = await Therapist.create({
      name,
      email: email.toLowerCase(),
      password_hash,
      slug,
    });

    res.status(201).json({
      message: "Therapist account created successfully",

      therapist: {
        id: therapist._id,
        name: therapist.name,
        email: therapist.email,
        slug: therapist.slug,
      },
    });
  } catch (error) {
    console.error("Signup error:", error.message);

    res.status(500).json({
      message: "Server error during signup",
    });
  }
};

// ==========================================
// THERAPIST LOGIN
// ==========================================

const loginTherapist = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const therapist = await Therapist.findOne({
      email: email.toLowerCase(),
    });

    if (!therapist) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      therapist.password_hash
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        therapistId: therapist._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.status(200).json({
      message: "Login successful",

      token,

      therapist: {
        id: therapist._id,
        name: therapist.name,
        email: therapist.email,
        slug: therapist.slug,
        bio: therapist.bio,
        specializations: therapist.specializations,
        languages: therapist.languages,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    res.status(500).json({
      message: "Server error during login",
    });
  }
};

// ==========================================
// GET THERAPIST PROFILE
// ==========================================

const getTherapistProfile = async (req, res) => {
  try {
    const therapist = await Therapist.findById(
      req.therapistId
    ).select("-password_hash");

    if (!therapist) {
      return res.status(404).json({
        message: "Therapist not found",
      });
    }

    res.status(200).json({
      therapist,
    });
  } catch (error) {
    console.error(
      "Get profile error:",
      error.message
    );

    res.status(500).json({
      message: "Server error while fetching profile",
    });
  }
};

// ==========================================
// UPDATE THERAPIST PROFILE
// ==========================================

const updateTherapistProfile = async (req, res) => {
  try {
    const {
      name,
      bio,
      specializations,
      languages,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Name is required",
      });
    }

    const therapist = await Therapist.findById(
      req.therapistId
    );

    if (!therapist) {
      return res.status(404).json({
        message: "Therapist not found",
      });
    }

    therapist.name = name.trim();

    therapist.bio = bio || "";

    therapist.specializations =
      Array.isArray(specializations)
        ? specializations
        : [];

    therapist.languages =
      Array.isArray(languages)
        ? languages
        : [];

    await therapist.save();

    res.status(200).json({
      message: "Profile updated successfully",

      therapist: {
        id: therapist._id,
        name: therapist.name,
        email: therapist.email,
        slug: therapist.slug,
        bio: therapist.bio,
        specializations: therapist.specializations,
        languages: therapist.languages,
      },
    });
  } catch (error) {
    console.error(
      "Update profile error:",
      error.message
    );

    res.status(500).json({
      message: "Server error while updating profile",
    });
  }
};

// ==========================================
// GET PUBLIC THERAPIST PROFILE BY SLUG
// ==========================================

const getPublicTherapistBySlug = async (req, res) => {
  try {
    const therapist = await Therapist.findOne({
      slug: req.params.slug,
    }).select("-password_hash -email");

    if (!therapist) {
      return res.status(404).json({
        message: "Therapist not found",
      });
    }

    res.status(200).json({
      message: "Therapist profile found",

      therapist,
    });
  } catch (error) {
    console.error(
      "Public therapist profile error:",
      error.message
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// EXPORT CONTROLLERS
// ==========================================

module.exports = {
  signupTherapist,
  loginTherapist,
  getTherapistProfile,
  updateTherapistProfile,
  getPublicTherapistBySlug,
};