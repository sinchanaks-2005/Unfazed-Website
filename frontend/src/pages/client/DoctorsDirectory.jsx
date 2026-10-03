import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import "./DoctorsDirectory.css";

const SPECIALIZATIONS = [
  "All",
  "Gynecologist",
  "Dermatologist",
  "Cardiologist",
  "Pediatrician",
  "Neurologist",
  "Orthopedic Specialist",
  "General Physician",
  "ENT Specialist",
  "Ophthalmologist",
  "Psychiatrist",
  "Psychologist",
  "Dentist",
  "Gastroenterologist",
  "Endocrinologist",
  "Pulmonologist",
];

const SPEC_ICONS = {
  Gynecologist: "🩺",
  Dermatologist: "✨",
  Cardiologist: "❤️",
  Pediatrician: "👶",
  Neurologist: "🧠",
  "Orthopedic Specialist": "🦴",
  "General Physician": "⚕️",
  "ENT Specialist": "👂",
  Ophthalmologist: "👁️",
  Psychiatrist: "🧩",
  Psychologist: "💬",
  Dentist: "🦷",
  Gastroenterologist: "🫀",
  Endocrinologist: "⚖️",
  Pulmonologist: "🫁",
};

function DoctorsDirectory() {
  const navigate = useNavigate();

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSpec, setSelectedSpec] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchDoctors();
    // eslint-disable-next-line
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axiosInstance.get(
        "/therapists/public"
      );

      setDoctors(res.data.therapists || []);
    } catch (err) {
      setError(
        "Unable to load doctors. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctors = doctors.filter((doc) => {
    const matchSpec =
      selectedSpec === "All" ||
      (doc.specializations || []).some((s) =>
        s.toLowerCase().includes(
          selectedSpec.toLowerCase()
        )
      );

    const searchLower =
      search.toLowerCase().trim();

    const matchSearch =
      !searchLower ||
      doc.name?.toLowerCase().includes(searchLower) ||
      (doc.specializations || []).some((s) =>
        s.toLowerCase().includes(searchLower)
      ) ||
      doc.bio?.toLowerCase().includes(searchLower);

    return matchSpec && matchSearch;
  });

  return (
    <div className="doctors-directory">

      {/* Navbar */}
      <nav className="dir-navbar">
        <Link to="/" className="dir-logo">
          <span className="logo-mark">U</span>
          <span>UNFAZED</span>
        </Link>

        <div className="dir-nav-links">
          <Link to="/">Home</Link>

          <Link
            to="/therapist/login"
            className="nav-login"
          >
            Therapist Login
          </Link>
        </div>
      </nav>

      {/* Page Header */}
      <div className="dir-header">
        <p className="dir-label">
          FIND A SPECIALIST
        </p>

        <h1>Find the Right Doctor for You</h1>

        <p className="dir-subtitle">
          Browse our network of verified specialists.
          Choose by specialization and book a session
          instantly.
        </p>

        {/* Search */}
        <div className="dir-search-wrap">
          <span className="search-icon">
            🔍
          </span>

          <input
            type="text"
            placeholder="Search by name or specialization..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="dir-search"
          />
        </div>
      </div>

      {/* Specialization Filter Chips */}
      <div className="spec-filter-row">
        {SPECIALIZATIONS.map((spec) => (
          <button
            key={spec}
            className={`spec-chip ${
              selectedSpec === spec
                ? "active"
                : ""
            }`}
            onClick={() =>
              setSelectedSpec(spec)
            }
          >
            {spec !== "All" &&
              (SPEC_ICONS[spec] || "🩺")}{" "}
            {spec}
          </button>
        ))}
      </div>

      {/* Results count */}
      {!loading && !error && (
        <div className="dir-results-info">
          {filteredDoctors.length === 0
            ? "No doctors found for your search."
            : `Showing ${
                filteredDoctors.length
              } doctor${
                filteredDoctors.length !== 1
                  ? "s"
                  : ""
              }${
                selectedSpec !== "All"
                  ? ` · ${selectedSpec}`
                  : ""
              }`}
        </div>
      )}

      {/* Doctor Cards */}
      <div className="dir-cards-grid">

        {loading ? (
          Array.from({ length: 6 }).map(
            (_, i) => (
              <div
                key={i}
                className="doctor-card skeleton-card"
              >
                <div className="skeleton-avatar"></div>

                <div className="skeleton-lines">
                  <div className="skeleton-line long"></div>
                  <div className="skeleton-line short"></div>
                  <div className="skeleton-line medium"></div>
                </div>
              </div>
            )
          )
        ) : error ? (
          <div className="dir-error">
            <p>{error}</p>

            <button
              onClick={fetchDoctors}
              className="retry-btn"
            >
              Retry
            </button>
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="dir-empty">
            <div className="empty-icon">
              🔍
            </div>

            <h3>No doctors found</h3>

            <p>
              Try a different specialization or
              clear your search.
            </p>

            <button
              className="retry-btn"
              onClick={() => {
                setSelectedSpec("All");
                setSearch("");
              }}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          filteredDoctors.map((doc) => (
            <div
              key={doc._id}
              className="doctor-card"
            >

              {/* Avatar / Image */}
              <div className="doctor-card-top">
                {doc.profileImage ? (
                  <img
                    src={doc.profileImage}
                    alt={doc.name}
                    className="doctor-avatar-img"
                    onError={(e) => {
                      e.target.style.display =
                        "none";

                      e.target.nextSibling.style.display =
                        "flex";
                    }}
                  />
                ) : null}

                <div
                  className="doctor-avatar-fallback"
                  style={{
                    display: doc.profileImage
                      ? "none"
                      : "flex",
                  }}
                >
                  {(doc.name || "?")
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="doctor-card-info">
                  <h3 className="doctor-name">
                    {doc.name}
                  </h3>

                  <p className="doctor-spec">
                    {SPEC_ICONS[
                      doc.specializations?.[0]
                    ] || "🩺"}{" "}
                    {doc.specializations?.join(
                      ", "
                    ) ||
                      "General Practice"}
                  </p>

                  {doc.experience > 0 && (
                    <p className="doctor-exp">
                      ⏱ {doc.experience} years exp.
                    </p>
                  )}
                </div>
              </div>

              {/* Qualifications */}
              {doc.qualification && (
                <p className="doctor-qualification">
                  🎓 {doc.qualification}
                </p>
              )}

              {/* Languages */}
              {doc.languages?.length > 0 && (
                <p className="doctor-langs">
                  🗣{" "}
                  {doc.languages.join(", ")}
                </p>
              )}

              {/* Bio snippet */}
              <p className="doctor-bio">
                {doc.bio?.length > 130
                  ? doc.bio.slice(0, 130) + "..."
                  : doc.bio}
              </p>

              {/* Fee */}
              {doc.consultationFee > 0 && (
                <p className="doctor-fee">
                  💰 Consultation:{" "}
                  <strong>
                    ₹{doc.consultationFee}
                  </strong>
                </p>
              )}

              {/* Actions */}
              <div className="doctor-card-actions">
                <button
                  className="card-view-btn"
                  onClick={() =>
                    navigate(
                      `/therapist/${doc.slug}`
                    )
                  }
                >
                  View Profile
                </button>

                <button
                  className="card-book-btn"
                  onClick={() =>
                    navigate(
                      `/therapist/${doc.slug}/book`
                    )
                  }
                >
                  Book Session →
                </button>
              </div>

            </div>
          ))
        )}

      </div>

      {/* Footer */}
      <footer className="dir-footer">
        <p>
          © 2026 UNFAZED · Your health, your choice.
        </p>
      </footer>

    </div>
  );
}

export default DoctorsDirectory;