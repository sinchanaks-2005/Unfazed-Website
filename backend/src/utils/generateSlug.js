/**
 * Generates a URL-safe lowercase slug from a therapist name.
 * e.g. "Dr. Sharma Ph.D" -> "dr-sharma"
 */
const generateSlug = (name) => {
  if (!name) return "";
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

module.exports = generateSlug;

