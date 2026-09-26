const Therapist = require("../models/Therapist");
const Lead = require("../models/Lead");

/**
 * Distribute an incoming lead to the best matching therapist.
 */
const assignLead = async (leadData) => {
  const { name, email, phone, concern, preferredLanguage } = leadData;

  // Find active therapists matching language or specialization
  let query = {};
  if (preferredLanguage) {
    query.languages = { $in: [new RegExp(preferredLanguage, "i")] };
  }

  let candidates = await Therapist.find(query);
  if (candidates.length === 0) {
    candidates = await Therapist.find({});
  }

  const selectedTherapist = candidates.length > 0 ? candidates[0] : null;

  const lead = await Lead.create({
    name,
    email,
    phone: phone || "",
    concern: concern || "",
    preferredLanguage: preferredLanguage || "English",
    assignedTherapist: selectedTherapist ? selectedTherapist._id : null,
    status: "new",
  });

  return {
    lead,
    assignedTherapist: selectedTherapist,
  };
};

module.exports = {
  assignLead,
};

