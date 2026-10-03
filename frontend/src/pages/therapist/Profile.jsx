import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import "./Profile.css";

function Profile() {
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [specializations, setSpecializations] = useState("");
  const [languages, setLanguages] = useState("");

  const [therapist, setTherapist] = useState({});

  // ==========================================
  // LOAD PROFILE FROM MONGODB
  // ==========================================

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          navigate("/therapist/login");
          return;
        }

        const response = await axiosInstance.get(
          "/therapists/profile",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = response.data.therapist;

        setTherapist(data);
        setName(data.name || "");
        setEmail(data.email || "");
        setBio(data.bio || "");

        setSpecializations(
          data.specializations?.join(", ") || ""
        );

        setLanguages(
          data.languages?.join(", ") || ""
        );

        localStorage.setItem(
          "therapist",
          JSON.stringify(data)
        );
      } catch (error) {
        console.error(
          "Profile loading error:",
          error.message
        );

        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("therapist");

          navigate("/therapist/login");
        } else {
          alert(
            error.response?.data?.message ||
              "Unable to load profile."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  // ==========================================
  // EDIT PROFILE
  // ==========================================

  const handleEdit = () => {
    setIsEditing(true);
  };

  // ==========================================
  // CANCEL EDIT
  // ==========================================

  const handleCancel = () => {
    setName(therapist.name || "");
    setBio(therapist.bio || "");

    setSpecializations(
      therapist.specializations?.join(", ") || ""
    );

    setLanguages(
      therapist.languages?.join(", ") || ""
    );

    setIsEditing(false);
  };

  // ==========================================
  // SAVE PROFILE
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");

      const specializationArray = specializations
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item !== "");

      const languageArray = languages
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item !== "");

      const response = await axiosInstance.put(
        "/therapists/profile",
        {
          name: name.trim(),
          bio: bio.trim(),
          specializations: specializationArray,
          languages: languageArray,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updatedTherapist =
        response.data.therapist;

      setTherapist(updatedTherapist);

      setName(updatedTherapist.name || "");
      setEmail(updatedTherapist.email || "");
      setBio(updatedTherapist.bio || "");

      setSpecializations(
        updatedTherapist.specializations?.join(", ") || ""
      );

      setLanguages(
        updatedTherapist.languages?.join(", ") || ""
      );

      localStorage.setItem(
        "therapist",
        JSON.stringify(updatedTherapist)
      );

      setIsEditing(false);

      alert("Profile updated successfully!");
    } catch (error) {
      console.error(
        "Profile update error:",
        error.message
      );

      alert(
        error.response?.data?.message ||
          "Unable to update profile."
      );
    }
  };

  // ==========================================
  // VIEW PUBLIC PROFILE
  // ==========================================

  const handleViewPublicProfile = () => {
    if (therapist.slug) {
      navigate(`/therapist/${therapist.slug}`);
    } else {
      alert("Please complete your profile first.");
    }
  };

  // ==========================================
  // LOADING SCREEN
  // ==========================================

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="profile-loader"></div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  // ==========================================
  // PROFILE PAGE
  // ==========================================

  return (
    <div className="profile-page">
      {/* Top Header */}

      <header className="profile-topbar">
        <button
          className="back-button"
          onClick={() =>
            navigate("/therapist/dashboard")
          }
        >
          ← Back to Dashboard
        </button>

        <div className="profile-page-title">
          <span>THERAPIST PORTAL</span>
          <h1>My Profile</h1>
        </div>
      </header>

      <div className="profile-layout">
        {/* =====================================
            LEFT PROFILE CARD
        ====================================== */}

        <aside className="profile-side-card">
          <div className="profile-cover"></div>

          <div className="profile-avatar-large">
            {name.charAt(0).toUpperCase() || "T"}
          </div>

          <div className="profile-side-content">
            <h2>{name || "Therapist"}</h2>

            <p className="profile-role">
              Therapist
            </p>

            <p className="profile-email">
              {email}
            </p>

            <div className="profile-status">
              <span></span>
              Profile Active
            </div>

            <div className="side-divider"></div>

            {/* Public Profile */}

            <div className="public-profile-title">
              <span>PUBLIC PROFILE</span>
              <h3>Your Branded Link</h3>
            </div>

            <div className="branded-link-box">
              <span>
                unfazed.com/therapist/
              </span>

              <strong>
                {therapist.slug || "your-profile"}
              </strong>
            </div>

            <button
              type="button"
              className="preview-button"
              onClick={handleViewPublicProfile}
            >
              View Public Profile
            </button>
          </div>
        </aside>

        {/* =====================================
            RIGHT CONTENT
        ====================================== */}

        <main className="profile-main-content">
          <div className="profile-intro">
            <span>
              PROFESSIONAL INFORMATION
            </span>

            <h2>
              {isEditing
                ? "Edit your profile"
                : "Your professional profile"}
            </h2>

            <p>
              {isEditing
                ? "Update your information and save your changes."
                : "Review your professional information and profile details."}
            </p>
          </div>

          <form
            className="professional-form"
            onSubmit={handleSubmit}
          >
            {/* =====================================
                PERSONAL INFORMATION
            ====================================== */}

            <section className="profile-form-card">
              <div className="form-card-heading">
                <div className="heading-icon">
                  👤
                </div>

                <div>
                  <h3>Personal Information</h3>

                  <p>
                    Your basic account information
                  </p>
                </div>
              </div>

              <div className="form-grid">
                <div className="profile-field">
                  <label>Full Name</label>

                  <input
                    type="text"
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value)
                    }
                    disabled={!isEditing}
                    required
                  />
                </div>

                <div className="profile-field">
                  <label>Email Address</label>

                  <input
                    type="email"
                    value={email}
                    disabled
                  />

                  <small>
                    Email cannot be changed here.
                  </small>
                </div>
              </div>
            </section>

            {/* =====================================
                ABOUT
            ====================================== */}

            <section className="profile-form-card">
              <div className="form-card-heading">
                <div className="heading-icon">
                  ✦
                </div>

                <div>
                  <h3>About You</h3>

                  <p>
                    Introduce yourself to potential clients
                  </p>
                </div>
              </div>

              <div className="profile-field">
                <label>Professional Bio</label>

                <textarea
                  rows="6"
                  value={bio}
                  onChange={(e) =>
                    setBio(e.target.value)
                  }
                  disabled={!isEditing}
                  placeholder="Write a short professional introduction..."
                />

                <small>
                  A clear and welcoming introduction helps
                  clients understand your approach.
                </small>
              </div>
            </section>

            {/* =====================================
                EXPERTISE
            ====================================== */}

            <section className="profile-form-card">
              <div className="form-card-heading">
                <div className="heading-icon">
                  ☆
                </div>

                <div>
                  <h3>Areas of Expertise</h3>

                  <p>
                    Highlight the areas where you help clients
                  </p>
                </div>
              </div>

              <div className="profile-field">
                <label>Specializations</label>

                <input
                  type="text"
                  value={specializations}
                  onChange={(e) =>
                    setSpecializations(
                      e.target.value
                    )
                  }
                  disabled={!isEditing}
                  placeholder="Anxiety, Stress Management..."
                />

                <small>
                  Separate multiple specializations with commas.
                </small>
              </div>

              <div className="profile-field">
                <label>Languages</label>

                <input
                  type="text"
                  value={languages}
                  onChange={(e) =>
                    setLanguages(e.target.value)
                  }
                  disabled={!isEditing}
                  placeholder="English, Kannada, Hindi"
                />

                <small>
                  Separate multiple languages with commas.
                </small>
              </div>
            </section>

            {/* =====================================
                ACTION AREA
            ====================================== */}

            <div className="profile-save-area">
              {!isEditing ? (
                <>
                  <div>
                    <strong>
                      Want to update your information?
                    </strong>

                    <span>
                      You can edit your professional profile anytime.
                    </span>
                  </div>

                  <button
                    type="button"
                    className="save-profile-button"
                    onClick={handleEdit}
                  >
                    Edit Profile
                  </button>
                </>
              ) : (
                <>
                  <div>
                    <strong>
                      Editing your profile
                    </strong>

                    <span>
                      Save your changes or cancel to keep
                      the previous information.
                    </span>
                  </div>

                  <div className="profile-action-buttons">
                    <button
                      type="button"
                      className="cancel-profile-button"
                      onClick={handleCancel}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="save-profile-button"
                    >
                      Save Changes
                    </button>
                  </div>
                </>
              )}
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}

export default Profile;