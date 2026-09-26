const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Therapist = require("../models/Therapist");

// ==========================================
// CREATE UNIQUE SLUG
// ==========================================

const createUniqueSlug = async (name) => {
  const baseSlug =
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "therapist";

  let slug = baseSlug;
  let counter = 1;

  while (await Therapist.exists({ slug })) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  return slug;
};

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

    const normalizedEmail = email.trim().toLowerCase();

    const existingTherapist = await Therapist.findOne({
      email: normalizedEmail,
    });

    if (existingTherapist) {
      return res.status(409).json({
        message: "Email already registered",
      });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const slug = await createUniqueSlug(name);

    const therapist = await Therapist.create({
      name: name.trim(),
      email: normalizedEmail,
      password_hash,
      slug,
    });

    return res.status(201).json({
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

    return res.status(500).json({
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

    const normalizedEmail = email.trim().toLowerCase();

    const therapist = await Therapist.findOne({
      email: normalizedEmail,
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
        therapistId: therapist._id.toString(),
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.status(200).json({
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
        profileImage: therapist.profileImage,
        experience: therapist.experience,
        qualification: therapist.qualification,
        consultationFee: therapist.consultationFee,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      message: "Server error during login",
    });
  }
};

// ==========================================
// GET THERAPIST PROFILE
// ==========================================

const getTherapistProfile = async (req, res) => {
  try {
    if (!req.therapist) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const therapist = await Therapist.findById(
      req.therapist._id
    ).select("-password_hash");

    if (!therapist) {
      return res.status(404).json({
        message: "Therapist not found",
      });
    }

    return res.status(200).json({
      therapist,
    });
  } catch (error) {
    console.error(
      "Get profile error:",
      error.message
    );

    return res.status(500).json({
      message: "Server error while fetching profile",
    });
  }
};

// ==========================================
// UPDATE THERAPIST PROFILE
// ==========================================

const updateTherapistProfile = async (req, res) => {
  try {
    if (!req.therapist) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const {
      name,
      bio,
      specializations,
      languages,
      profileImage,
      experience,
      qualification,
      consultationFee,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Name is required",
      });
    }

    const therapist = await Therapist.findById(
      req.therapist._id
    );

    if (!therapist) {
      return res.status(404).json({
        message: "Therapist not found",
      });
    }

    therapist.name = name.trim();

    if (bio !== undefined) {
      therapist.bio = bio.trim();
    }

    if (specializations !== undefined) {
      therapist.specializations = Array.isArray(
        specializations
      )
        ? specializations
        : [];
    }

    if (languages !== undefined) {
      therapist.languages = Array.isArray(languages)
        ? languages
        : [];
    }

    if (profileImage !== undefined) {
      therapist.profileImage = profileImage;
    }

    if (experience !== undefined) {
      therapist.experience = Number(experience) || 0;
    }

    if (qualification !== undefined) {
      therapist.qualification = qualification;
    }

    if (consultationFee !== undefined) {
      therapist.consultationFee =
        Number(consultationFee) || 0;
    }

    await therapist.save();

    return res.status(200).json({
      message: "Profile updated successfully",

      therapist: {
        id: therapist._id,
        name: therapist.name,
        email: therapist.email,
        slug: therapist.slug,
        bio: therapist.bio,
        specializations: therapist.specializations,
        languages: therapist.languages,
        profileImage: therapist.profileImage,
        experience: therapist.experience,
        qualification: therapist.qualification,
        consultationFee: therapist.consultationFee,
      },
    });
  } catch (error) {
    console.error(
      "Update profile error:",
      error.message
    );

    return res.status(500).json({
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

    return res.status(200).json({
      message: "Therapist profile found",
      therapist,
    });
  } catch (error) {
    console.error(
      "Public therapist profile error:",
      error.message
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// GET PUBLIC THERAPIST DIRECTORY
// GET /api/therapists/public
// Optional:
// ?specialization=Dermatologist
// ?search=keyword
// ==========================================

const getPublicTherapists = async (req, res) => {
  try {
    const filter = {};
    const { specialization, search } = req.query;

    if (specialization && specialization.trim()) {
      filter.specializations = {
        $in: [
          new RegExp(
            specialization.trim(),
            "i"
          ),
        ],
      };
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(
        search.trim(),
        "i"
      );

      filter.$or = [
        {
          name: searchRegex,
        },
        {
          specializations: {
            $in: [searchRegex],
          },
        },
        {
          bio: searchRegex,
        },
      ];
    }

    const therapists = await Therapist.find(filter)
      .select(
        "_id name slug bio specializations languages profileImage experience qualification consultationFee"
      )
      .sort({
        createdAt: 1,
      });

    return res.status(200).json({
      therapists,
      total: therapists.length,
    });
  } catch (error) {
    console.error(
      "Public therapist directory error:",
      error.message
    );

    return res.status(500).json({
      message:
        "Server error while fetching therapists",
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
  getPublicTherapists,
};