import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./BookingPage.css";

const COMMON_TIMEZONES = [
  { value: "Asia/Kolkata", label: "India (IST, UTC+5:30)" },
  { value: "Asia/Dubai", label: "Dubai (GST, UTC+4)" },
  { value: "Asia/Singapore", label: "Singapore (SGT, UTC+8)" },
  { value: "Europe/London", label: "London (GMT/BST, UTC+0/+1)" },
  { value: "America/New_York", label: "New York (EST/EDT, UTC-5/-4)" },
  {
    value: "America/Los_Angeles",
    label: "Los Angeles (PST/PDT, UTC-8/-7)",
  },
  { value: "Australia/Sydney", label: "Sydney (AEST, UTC+10)" },
];

function BookingPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  // =====================================================
  // THERAPIST DATA
  // =====================================================

  const [therapist, setTherapist] = useState(null);
  const [therapistLoading, setTherapistLoading] = useState(true);
  const [therapistError, setTherapistError] = useState("");

  // =====================================================
  // TIMEZONE
  // =====================================================

  const userLocalTz =
    Intl.DateTimeFormat().resolvedOptions().timeZone ||
    "Asia/Kolkata";

  const [clientTimezone, setClientTimezone] =
    useState(userLocalTz);

  // =====================================================
  // DATE & SLOTS
  // =====================================================

  const [date, setDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState("");

  // =====================================================
  // BOOKING MODAL
  // =====================================================

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Basic information
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");

  // Clinical / intake information
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [occupation, setOccupation] = useState("");
  const [location, setLocation] = useState("");
  const [presentingConcern, setPresentingConcern] =
    useState("");
  const [history, setHistory] = useState("");

  // Session notes
  const [notes, setNotes] = useState("");

  // Consent
  const [consentAgreed, setConsentAgreed] =
    useState(false);

  const [bookingLoading, setBookingLoading] =
    useState(false);

  const [bookingError, setBookingError] = useState("");

  const [bookingConfirmation, setBookingConfirmation] =
    useState(null);

  // =====================================================
  // FETCH THERAPIST
  // =====================================================

  useEffect(() => {
    if (!slug) {
      setTherapistError(
        "Therapist not specified in link."
      );
      setTherapistLoading(false);
      return;
    }

    const fetchTherapist = async () => {
      try {
        setTherapistLoading(true);

        const res = await axios.get(
          `http://localhost:5000/api/therapists/public/${slug}`
        );

        setTherapist(res.data.therapist);
      } catch (err) {
        setTherapistError(
          err.response?.data?.message ||
            "Unable to load therapist details. Please verify the URL."
        );
      } finally {
        setTherapistLoading(false);
      }
    };

    fetchTherapist();
  }, [slug]);

  // =====================================================
  // FETCH AVAILABLE SLOTS
  // =====================================================

  const fetchSlots = useCallback(
    async (selectedDate, therapistId) => {
      if (!selectedDate || !therapistId) return;

      try {
        setSlotsLoading(true);
        setSlotsError("");

        const res = await axios.get(
          "http://localhost:5000/api/scheduling/slots",
          {
            params: {
              therapistId,
              date: selectedDate,
            },
          }
        );

        setSlots(res.data.slots || []);
      } catch (err) {
        setSlotsError(
          err.response?.data?.message ||
            "Failed to load available slots."
        );

        setSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    },
    []
  );

  // =====================================================
  // DATE CHANGE
  // =====================================================

  const handleDateChange = (e) => {
    const selectedDate = e.target.value;

    setDate(selectedDate);
    setSelectedSlot(null);
    setBookingError("");

    if (therapist?._id) {
      fetchSlots(selectedDate, therapist._id);
    }
  };

  // =====================================================
  // FORMAT TIME
  // =====================================================

  const formatTimeInClientTz = (isoString) => {
    try {
      return new Date(isoString).toLocaleTimeString(
        [],
        {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: clientTimezone,
        }
      );
    } catch {
      return new Date(
        isoString
      ).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDateInClientTz = (isoString) => {
    try {
      return new Date(isoString).toLocaleDateString(
        [],
        {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
          timeZone: clientTimezone,
        }
      );
    } catch {
      return new Date(
        isoString
      ).toLocaleDateString();
    }
  };

  // =====================================================
  // OPEN BOOKING MODAL
  // =====================================================

  const handleOpenBookingModal = () => {
    if (!selectedSlot) return;

    setBookingError("");
    setIsModalOpen(true);
  };

  // =====================================================
  // CONFIRM BOOKING
  // =====================================================

  const handleConfirmBooking = async (e) => {
    e.preventDefault();

    if (!therapist?._id || !selectedSlot) {
      return;
    }

    // Basic validation
    if (
      !clientName.trim() ||
      !clientEmail.trim()
    ) {
      setBookingError(
        "Please provide your name and email address."
      );
      return;
    }

    // Intake validation
    if (!age || Number(age) <= 0) {
      setBookingError(
        "Please provide your age."
      );
      return;
    }

    if (!gender) {
      setBookingError(
        "Please select your gender."
      );
      return;
    }

    if (!occupation.trim()) {
      setBookingError(
        "Please provide your occupation."
      );
      return;
    }

    if (!location.trim()) {
      setBookingError(
        "Please provide your location."
      );
      return;
    }

    if (!presentingConcern.trim()) {
      setBookingError(
        "Please describe your presenting concern."
      );
      return;
    }

    if (!consentAgreed) {
      setBookingError(
        "Please review and agree to the consent terms."
      );
      return;
    }

    try {
      setBookingLoading(true);
      setBookingError("");

      const payload = {
        therapistId: therapist._id,

        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,

        // Basic information
        clientName: clientName.trim(),
        clientEmail:
          clientEmail.trim().toLowerCase(),
        clientPhone: clientPhone.trim(),

        // Intake information
        age: Number(age),
        gender: gender,
        occupation: occupation.trim(),
        location: location.trim(),
        presentingConcern:
          presentingConcern.trim(),
        history: history.trim(),

        // Session notes
        notes: notes.trim(),

        // Consent
        consentAgreed: true,

        // Client timezone
        timezone: clientTimezone,
      };

      const res = await axios.post(
        "http://localhost:5000/api/scheduling/book",
        payload
      );

      // Successful booking
      setBookingConfirmation(res.data.session);

      setIsModalOpen(false);

      // Refresh slots so booked slot disappears
      fetchSlots(date, therapist._id);

      setSelectedSlot(null);
    } catch (err) {
      const errMsg =
        err.response?.data?.message ||
        "Booking failed. The slot may have already been reserved.";

      setBookingError(errMsg);

      // Refresh slots if another client booked it
      if (err.response?.status === 409) {
        fetchSlots(date, therapist._id);
        setSelectedSlot(null);
      }
    } finally {
      setBookingLoading(false);
    }
  };

  // =====================================================
  // RESET BOOKING
  // =====================================================

  const handleResetBooking = () => {
    setBookingConfirmation(null);
    setSelectedSlot(null);
    setDate("");
    setSlots([]);
    setBookingError("");

    setClientName("");
    setClientEmail("");
    setClientPhone("");

    setAge("");
    setGender("");
    setOccupation("");
    setLocation("");
    setPresentingConcern("");
    setHistory("");

    setNotes("");
    setConsentAgreed(false);
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (therapistLoading) {
    return (
      <div className="booking-page">
        <div className="booking-loading-card">
          <div className="booking-spinner"></div>
          <p>
            Loading therapist availability...
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (therapistError) {
    return (
      <div className="booking-page">
        <div className="booking-error-card">
          <h2>Therapist Not Available</h2>

          <p>{therapistError}</p>

          <button
            className="secondary-nav-btn"
            onClick={() =>
              navigate("/therapist/login")
            }
          >
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  // =====================================================
  // MAIN UI
  // =====================================================

  return (
    <div className="booking-page">
      <div className="booking-container">

        {/* Back Navigation */}
        <div className="booking-top-nav">
          <Link
            to={`/${slug}`}
            className="back-link"
          >
            ← Back to {therapist.name}&apos;s Profile
          </Link>
        </div>

        {/* Therapist Header */}
        <div className="therapist-summary-header">
          <div className="therapist-mini-avatar">
            {therapist.name
              .charAt(0)
              .toUpperCase()}
          </div>

          <div>
            <p className="booking-subtitle-label">
              BOOK A PRIVATE SESSION
            </p>

            <h1>{therapist.name}</h1>

            <p className="therapist-specialties-text">
              {therapist.specializations?.length >
              0
                ? therapist.specializations.join(
                    " • "
                  )
                : "Professional Mental Health Support"}
            </p>
          </div>
        </div>

        {/* =================================================
            SUCCESS CONFIRMATION
        ================================================= */}

        {bookingConfirmation ? (
          <div className="confirmation-card">
            <div className="confirmation-badge">
              ✓
            </div>

            <h2>Session Confirmed!</h2>

            <p className="confirmation-desc">
              Your appointment has been scheduled
              with{" "}
              <strong>{therapist.name}</strong>.
            </p>

            <div className="confirmation-details-box">

              <div className="confirmation-detail-item">
                <span>Date:</span>

                <strong>
                  {formatDateInClientTz(
                    bookingConfirmation.startTime
                  )}
                </strong>
              </div>

              <div className="confirmation-detail-item">
                <span>Time:</span>

                <strong>
                  {formatTimeInClientTz(
                    bookingConfirmation.startTime
                  )}{" "}
                  –{" "}
                  {formatTimeInClientTz(
                    bookingConfirmation.endTime
                  )}{" "}
                  ({clientTimezone})
                </strong>
              </div>

              <div className="confirmation-detail-item">
                <span>Duration:</span>

                <strong>
                  {bookingConfirmation.duration}{" "}
                  minutes
                </strong>
              </div>

              <div className="confirmation-detail-item">
                <span>Client:</span>

                <strong>
                  {bookingConfirmation.clientName}
                </strong>
              </div>

              <div className="confirmation-detail-item">
                <span>Email:</span>

                <strong>
                  {bookingConfirmation.clientEmail}
                </strong>
              </div>

              <div className="confirmation-detail-item">
                <span>Booking ID:</span>

                <code>
                  {bookingConfirmation.id}
                </code>
              </div>
            </div>

            <div className="confirmation-actions">
              <button
                type="button"
                className="confirm-another-btn"
                onClick={handleResetBooking}
              >
                Book Another Slot
              </button>

              <button
                type="button"
                className="return-profile-btn"
                onClick={() =>
                  navigate(`/${slug}`)
                }
              >
                Return to Profile
              </button>
            </div>
          </div>
        ) : (
          <div className="booking-card">

            {/* Date & Timezone */}
            <div className="booking-controls-grid">

              <div className="control-group">
                <label htmlFor="booking-date">
                  <span className="control-icon">
                    📅
                  </span>{" "}
                  1. Select Date
                </label>

                <input
                  id="booking-date"
                  type="date"
                  value={date}
                  onChange={handleDateChange}
                  min={
                    new Date()
                      .toISOString()
                      .split("T")[0]
                  }
                />
              </div>

              <div className="control-group">
                <label htmlFor="client-timezone">
                  <span className="control-icon">
                    🌐
                  </span>{" "}
                  2. Your Timezone
                </label>

                <select
                  id="client-timezone"
                  value={clientTimezone}
                  onChange={(e) =>
                    setClientTimezone(
                      e.target.value
                    )
                  }
                >
                  {!COMMON_TIMEZONES.some(
                    (t) =>
                      t.value ===
                      clientTimezone
                  ) && (
                    <option
                      value={clientTimezone}
                    >
                      Local ({clientTimezone})
                    </option>
                  )}

                  {COMMON_TIMEZONES.map((tz) => (
                    <option
                      key={tz.value}
                      value={tz.value}
                    >
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Error */}
            {slotsError && (
              <div className="booking-error">
                {slotsError}
              </div>
            )}

            {/* Loading */}
            {slotsLoading && (
              <div className="booking-message">
                <span className="mini-spinner"></span>
                Checking available slots...
              </div>
            )}

            {/* No date */}
            {!date && !slotsLoading && (
              <div className="select-date-prompt">
                <span className="prompt-icon">
                  👈
                </span>

                <p>
                  Please choose a date above to
                  display available session slots.
                </p>
              </div>
            )}

            {/* Slots */}
            {!slotsLoading &&
              date &&
              !slotsError && (
                <div className="slots-section">

                  <div className="slots-section-header">
                    <h2>Available Slots</h2>

                    <span className="slots-tz-badge">
                      Displayed in{" "}
                      {clientTimezone}
                    </span>
                  </div>

                  {slots.length === 0 ? (
                    <div className="no-slots">
                      <p>
                        No available slots found
                        for this date.
                      </p>

                      <small>
                        Please select another date
                        or check back later.
                      </small>
                    </div>
                  ) : (
                    <div className="slots-grid">
                      {slots.map((slot) => {
                        const isSelected =
                          selectedSlot?.startTime ===
                          slot.startTime;

                        return (
                          <button
                            key={slot.startTime}
                            type="button"
                            className={
                              isSelected
                                ? "slot-button selected"
                                : "slot-button"
                            }
                            onClick={() => {
                              setSelectedSlot(
                                slot
                              );
                              setBookingError("");
                            }}
                          >
                            <span className="slot-time-range">
                              {formatTimeInClientTz(
                                slot.startTime
                              )}{" "}
                              –{" "}
                              {formatTimeInClientTz(
                                slot.endTime
                              )}
                            </span>

                            <span className="slot-check">
                              {isSelected
                                ? "✓ Selected"
                                : "Available"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

            {/* Selected Slot */}
            {selectedSlot && (
              <div className="selected-slot-banner">

                <div className="selected-slot-info">
                  <span className="selected-label">
                    SELECTED TIME
                  </span>

                  <strong>
                    {formatDateInClientTz(
                      selectedSlot.startTime
                    )}{" "}
                    at{" "}
                    {formatTimeInClientTz(
                      selectedSlot.startTime
                    )}{" "}
                    –{" "}
                    {formatTimeInClientTz(
                      selectedSlot.endTime
                    )}{" "}
                    ({clientTimezone})
                  </strong>
                </div>

                <button
                  type="button"
                  className="continue-booking-btn"
                  onClick={
                    handleOpenBookingModal
                  }
                >
                  Continue to Book →
                </button>
              </div>
            )}
          </div>
        )}

        {/* =================================================
            BOOKING MODAL
        ================================================= */}

        {isModalOpen && selectedSlot && (
          <div className="modal-backdrop">

            <div className="booking-modal-card">

              {/* Modal Header */}
              <div className="modal-header">
                <div>
                  <span className="modal-label">
                    CONFIRM APPOINTMENT
                  </span>

                  <h2>
                    Client Information
                  </h2>
                </div>

                <button
                  type="button"
                  className="close-modal-btn"
                  onClick={() =>
                    setIsModalOpen(false)
                  }
                >
                  ✕
                </button>
              </div>

              {/* Appointment Summary */}
              <div className="modal-slot-summary">
                <p>
                  <strong>
                    Therapist:
                  </strong>{" "}
                  {therapist.name}
                </p>

                <p>
                  <strong>
                    Appointment:
                  </strong>{" "}
                  {formatDateInClientTz(
                    selectedSlot.startTime
                  )}
                  ,{" "}
                  {formatTimeInClientTz(
                    selectedSlot.startTime
                  )}{" "}
                  –{" "}
                  {formatTimeInClientTz(
                    selectedSlot.endTime
                  )}{" "}
                  ({clientTimezone})
                </p>
              </div>

              {/* Error */}
              {bookingError && (
                <div className="modal-error-alert">
                  {bookingError}
                </div>
              )}

              {/* =================================================
                  FORM
              ================================================= */}

              <form
                onSubmit={handleConfirmBooking}
                className="modal-form"
              >

                {/* BASIC INFORMATION */}
                <div className="form-section">
                  <h3>Basic Information</h3>

                  <div className="form-group">
                    <label htmlFor="client-name">
                      Full Name *
                    </label>

                    <input
                      id="client-name"
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={clientName}
                      onChange={(e) =>
                        setClientName(
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="client-email">
                      Email Address *
                    </label>

                    <input
                      id="client-email"
                      type="email"
                      required
                      placeholder="e.g. rahul@example.com"
                      value={clientEmail}
                      onChange={(e) =>
                        setClientEmail(
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="client-phone">
                      Phone Number
                    </label>

                    <input
                      id="client-phone"
                      type="tel"
                      placeholder="e.g. +91 98765 43210"
                      value={clientPhone}
                      onChange={(e) =>
                        setClientPhone(
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>

                {/* =================================================
                    CLINICAL DEMOGRAPHICS
                ================================================= */}

                <div className="form-section">
                  <h3>
                    Clinical Demographics &
                    Background
                  </h3>

                  <div className="form-row">

                    <div className="form-group">
                      <label htmlFor="client-age">
                        Age *
                      </label>

                      <input
                        id="client-age"
                        type="number"
                        min="1"
                        max="120"
                        required
                        placeholder="e.g. 25"
                        value={age}
                        onChange={(e) =>
                          setAge(e.target.value)
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="client-gender">
                        Gender *
                      </label>

                      <select
                        id="client-gender"
                        required
                        value={gender}
                        onChange={(e) =>
                          setGender(
                            e.target.value
                          )
                        }
                      >
                        <option value="">
                          Select gender
                        </option>

                        <option value="Female">
                          Female
                        </option>

                        <option value="Male">
                          Male
                        </option>

                        <option value="Non-binary">
                          Non-binary
                        </option>

                        <option value="Prefer not to say">
                          Prefer not to say
                        </option>

                        <option value="Other">
                          Other
                        </option>
                      </select>
                    </div>

                  </div>

                  <div className="form-row">

                    <div className="form-group">
                      <label htmlFor="client-occupation">
                        Occupation *
                      </label>

                      <input
                        id="client-occupation"
                        type="text"
                        required
                        placeholder="e.g. Student"
                        value={occupation}
                        onChange={(e) =>
                          setOccupation(
                            e.target.value
                          )
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="client-location">
                        Location *
                      </label>

                      <input
                        id="client-location"
                        type="text"
                        required
                        placeholder="e.g. Bengaluru"
                        value={location}
                        onChange={(e) =>
                          setLocation(
                            e.target.value
                          )
                        }
                      />
                    </div>

                  </div>
                </div>

                {/* =================================================
                    PRESENTING CONCERN
                ================================================= */}

                <div className="form-section">
                  <h3>
                    Reason for Seeking Support
                  </h3>

                  <div className="form-group">
                    <label htmlFor="presenting-concern">
                      Presenting Concern *
                    </label>

                    <textarea
                      id="presenting-concern"
                      rows="4"
                      required
                      placeholder="Please briefly describe what you would like support with..."
                      value={
                        presentingConcern
                      }
                      onChange={(e) =>
                        setPresentingConcern(
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="client-history">
                      Previous History
                    </label>

                    <textarea
                      id="client-history"
                      rows="4"
                      placeholder="Any previous therapy, relevant history, or background information..."
                      value={history}
                      onChange={(e) =>
                        setHistory(
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>

                {/* =================================================
                    SESSION NOTES
                ================================================= */}

                <div className="form-section">
                  <h3>Additional Notes</h3>

                  <div className="form-group">
                    <label htmlFor="client-notes">
                      Additional Notes
                    </label>

                    <textarea
                      id="client-notes"
                      rows="3"
                      placeholder="Anything else you would like the therapist to know..."
                      value={notes}
                      onChange={(e) =>
                        setNotes(e.target.value)
                      }
                    />
                  </div>
                </div>

                {/* =================================================
                    DIGITAL CONSENT
                ================================================= */}

                <div className="form-section consent-section">

                  <h3>
                    Digital Consent *
                  </h3>

                  <label className="consent-checkbox">

                    <input
                      type="checkbox"
                      checked={consentAgreed}
                      onChange={(e) =>
                        setConsentAgreed(
                          e.target.checked
                        )
                      }
                    />

                    <span>
                      I understand that the
                      information I provide will be
                      used by the therapist for
                      providing and managing my
                      therapy session. I agree to
                      the collection and storage of
                      this information for the
                      purpose of my care.
                    </span>

                  </label>
                </div>

                {/* ACTION BUTTONS */}

                <div className="modal-actions">

                  <button
                    type="button"
                    className="modal-cancel-btn"
                    onClick={() =>
                      setIsModalOpen(false)
                    }
                    disabled={bookingLoading}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="modal-submit-btn"
                    disabled={bookingLoading}
                  >
                    {bookingLoading
                      ? "Confirming..."
                      : "Agree & Book Slot"}
                  </button>

                </div>

              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BookingPage;