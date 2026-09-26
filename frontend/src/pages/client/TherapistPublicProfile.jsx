import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./TherapistPublicProfile.css";

function TherapistPublicProfile() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [therapist, setTherapist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTherapist = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/therapists/public/${slug}`
        );

        setTherapist(response.data.therapist);
      } catch (error) {
        setError(
          error.response?.data?.message ||
            "Unable to load therapist profile."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTherapist();
  }, [slug]);

  if (loading) {
    return (
      <div className="public-profile-page">
        <div className="profile-loading">
          Loading therapist profile...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="public-profile-page">
        <div className="profile-error">
          <h2>Therapist Not Found</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="public-profile-page">
      <div className="public-profile-container">

        <div className="public-profile-cover">
          <div className="public-profile-avatar">
            {therapist.name.charAt(0).toUpperCase()}
          </div>
        </div>

        <div className="public-profile-card">

          <div className="public-profile-header">
            <div>
              <p className="public-profile-label">
                UNFAZED THERAPIST
              </p>

              <h1>{therapist.name}</h1>

              <p className="public-profile-specialty">
                Professional Therapist
              </p>
            </div>

            <span className="verified-badge">
              ✓ Verified
            </span>
          </div>

          <div className="public-profile-section">
            <h2>About Me</h2>

            <p>
              {therapist.bio ||
                "A caring and supportive therapist dedicated to helping clients improve their emotional well-being and personal growth."}
            </p>
          </div>

          <div className="public-profile-details">

            <div className="public-detail-card">
              <h3>Specializations</h3>

              <div className="profile-tags">
                {therapist.specializations?.length > 0 ? (
                  therapist.specializations.map(
                    (specialization, index) => (
                      <span key={index}>
                        {specialization}
                      </span>
                    )
                  )
                ) : (
                  <span>General Therapy</span>
                )}
              </div>
            </div>

            <div className="public-detail-card">
              <h3>Languages</h3>

              <div className="profile-tags">
                {therapist.languages?.length > 0 ? (
                  therapist.languages.map(
                    (language, index) => (
                      <span key={index}>
                        {language}
                      </span>
                    )
                  )
                ) : (
                  <span>English</span>
                )}
              </div>
            </div>

          </div>

          <div className="public-profile-action">
            <h2>Ready to take the next step?</h2>

            <p>
              Connect with your therapist and begin your
              journey towards better emotional well-being.
            </p>

            <button
              className="book-session-cta"
              onClick={() => navigate(`/${slug}/book`)}
            >
              Book a Session
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default TherapistPublicProfile;