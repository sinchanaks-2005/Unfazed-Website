import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import "./BookingPage.css";

const TIMEZONES = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Kathmandu",
  "Europe/London",
  "Europe/Paris",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Australia/Sydney",
];

const getLocalTimezone = () => {
  try {
    return (
      Intl.DateTimeFormat().resolvedOptions().timeZone ||
      "Asia/Kolkata"
    );
  } catch {
    return "Asia/Kolkata";
  }
};

const formatDate = (dateString) => {
  if (!dateString) return "";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatTime = (dateString, timezone) => {
  if (!dateString) return "";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: timezone || getLocalTimezone(),
  });
};

const getSlotDuration = (slot) => {
  if (!slot?.startTime || !slot?.endTime) {
    return 0;
  }

  const start = new Date(slot.startTime).getTime();
  const end = new Date(slot.endTime).getTime();

  if (Number.isNaN(start) || Number.isNaN(end)) {
    return 0;
  }

  return Math.round((end - start) / 60000);
};

const formatCurrency = (amount) => {
  return Number(amount || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });
};

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );

    if (existingScript) {
      existingScript.addEventListener("load", () =>
        resolve(true)
      );

      existingScript.addEventListener("error", () =>
        resolve(false)
      );

      return;
    }

    const script = document.createElement("script");

    script.src =
      "https://checkout.razorpay.com/v1/checkout.js";

    script.async = true;

    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });
};

function BookingPage() {
  const { slug } = useParams();

  const [therapist, setTherapist] = useState(null);

  const [loadingTherapist, setLoadingTherapist] =
    useState(true);

  const [therapistError, setTherapistError] =
    useState("");

  const [date, setDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  const [slots, setSlots] = useState([]);

  const [loadingSlots, setLoadingSlots] =
    useState(false);

  const [slotsError, setSlotsError] = useState("");

  const [selectedSlot, setSelectedSlot] =
    useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");

  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [occupation, setOccupation] = useState("");
  const [location, setLocation] = useState("");

  const [presentingConcern, setPresentingConcern] =
    useState("");

  const [history, setHistory] = useState("");
  const [notes, setNotes] = useState("");

  const [consentAgreed, setConsentAgreed] =
    useState(false);

  const [clientTimezone, setClientTimezone] =
    useState(getLocalTimezone());

  const [bookingLoading, setBookingLoading] =
    useState(false);

  const [bookingError, setBookingError] = useState("");

  const [bookingConfirmation, setBookingConfirmation] =
    useState(null);

  const [packages, setPackages] = useState([]);

  const [packagesLoading, setPackagesLoading] =
    useState(false);

  const [selectedPaymentOption, setSelectedPaymentOption] =
    useState("single");

  const today = new Date().toISOString().split("T")[0];

  /* =====================================================
     FETCH THERAPIST
     ===================================================== */

  const fetchTherapist = useCallback(async () => {
    try {
      setLoadingTherapist(true);
      setTherapistError("");

      const response = await axiosInstance.get(
        "/therapists/public/" + slug
      );

      setTherapist(response.data?.therapist || null);
    } catch (error) {
      console.error(
        "Failed to fetch therapist:",
        error
      );

      setTherapistError(
        error.response?.data?.message ||
          "Unable to load therapist information."
      );
    } finally {
      setLoadingTherapist(false);
    }
  }, [slug]);

  /* =====================================================
     FETCH SLOTS
     ===================================================== */

  const fetchSlots = useCallback(
    async (selectedDate, therapistId) => {
      if (!selectedDate || !therapistId) return;

      try {
        setLoadingSlots(true);
        setSlotsError("");

        const response = await axiosInstance.get(
          "/scheduling/slots",
          {
            params: {
              therapistId,
              date: selectedDate,
            },
          }
        );

        setSlots(response.data?.slots || []);
      } catch (error) {
        console.error(
          "Failed to fetch slots:",
          error
        );

        setSlotsError(
          error.response?.data?.message ||
            "Unable to load available slots."
        );

        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    },
    []
  );

  /* =====================================================
     FETCH PACKAGES
     ===================================================== */

  const fetchPackages = useCallback(
    async (therapistId) => {
      if (!therapistId) return;

      try {
        setPackagesLoading(true);

        const response = await axiosInstance.get(
          "/payments/public/packages",
          {
            params: {
              therapistId,
            },
          }
        );

        const receivedPackages =
          response.data?.packages || [];

        const sortedPackages =
          receivedPackages
            .filter(
              (pkg) =>
                [3, 6, 12].includes(
                  Number(pkg.sessionCount)
                )
            )
            .sort(
              (a, b) =>
                Number(a.sessionCount) -
                Number(b.sessionCount)
            );

        setPackages(sortedPackages);
      } catch (error) {
        console.error(
          "Failed to fetch packages:",
          error
        );

        setPackages([]);
      } finally {
        setPackagesLoading(false);
      }
    },
    []
  );

  /* =====================================================
     EFFECTS
     ===================================================== */

  useEffect(() => {
    fetchTherapist();
  }, [fetchTherapist]);

  useEffect(() => {
    if (therapist?._id && date) {
      setSelectedSlot(null);

      fetchSlots(date, therapist._id);
    }
  }, [therapist, date, fetchSlots]);

  useEffect(() => {
    if (therapist?._id) {
      fetchPackages(therapist._id);
    }
  }, [therapist, fetchPackages]);

  /* =====================================================
     RESET FORM
     ===================================================== */

  const resetForm = () => {
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
    setBookingError("");
    setSelectedPaymentOption("single");
  };

  /* =====================================================
     DATE CHANGE
     ===================================================== */

  const handleDateChange = (event) => {
    setDate(event.target.value);
    setSelectedSlot(null);
    setIsModalOpen(false);
    setBookingConfirmation(null);
    setBookingError("");
  };

  /* =====================================================
     SLOT SELECTION

     IMPORTANT:
     selected slot is identified ONLY by startTime.
     This prevents undefined IDs from making every
     slot selected.
     ===================================================== */

  const handleSlotSelect = (slot) => {
    if (!slot?.startTime) return;

    setSelectedSlot(slot);
    setBookingError("");
    setBookingConfirmation(null);
  };

  const handleContinueBooking = () => {
    if (!selectedSlot) {
      setBookingError(
        "Please select an available slot first."
      );

      return;
    }

    setBookingError("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (bookingLoading) return;

    setIsModalOpen(false);
    setBookingError("");
  };

  /* =====================================================
     FORM VALIDATION
     ===================================================== */

  const validateForm = () => {
    if (!clientName.trim()) {
      return "Please enter your full name.";
    }

    if (!clientEmail.trim()) {
      return "Please enter your email address.";
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        clientEmail.trim()
      )
    ) {
      return "Please enter a valid email address.";
    }

    if (!clientPhone.trim()) {
      return "Please enter your phone number.";
    }

    if (
      !age ||
      Number(age) < 1 ||
      Number(age) > 120
    ) {
      return "Please enter a valid age.";
    }

    if (!gender) {
      return "Please select your gender.";
    }

    if (!occupation.trim()) {
      return "Please enter your occupation.";
    }

    if (!location.trim()) {
      return "Please enter your location.";
    }

    if (!presentingConcern.trim()) {
      return "Please describe your main concern.";
    }

    if (!consentAgreed) {
      return "Please agree to the consent before continuing.";
    }

    return "";
  };

  /* =====================================================
     PAYMENT OPTIONS

     Single Session = fixed ₹900

     Packages = 3 / 6 / 12 from backend
     ===================================================== */

  const singleSessionPrice = 900;

  const selectedPackage =
    packages.find(
      (pkg) =>
        String(pkg._id) ===
        String(selectedPaymentOption)
    ) || null;

  const selectedPaymentAmount = selectedPackage
    ? Number(selectedPackage.totalPrice || 0)
    : singleSessionPrice;

  const selectedPaymentLabel = selectedPackage
    ? `${selectedPackage.name} (${selectedPackage.sessionCount} sessions)`
    : "Single Session";

  /* =====================================================
     CONFIRM BOOKING + PAYMENT
     ===================================================== */

  const handleConfirmBooking = async (event) => {
    event.preventDefault();

    if (!selectedSlot || !therapist) {
      setBookingError(
        "Please select an available slot."
      );

      return;
    }

    const validationError = validateForm();

    if (validationError) {
      setBookingError(validationError);
      return;
    }

    try {
      setBookingLoading(true);
      setBookingError("");

      const bookingPayload = {
        therapistId: therapist._id,

        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,

        clientName: clientName.trim(),

        clientEmail:
          clientEmail.trim().toLowerCase(),

        clientPhone: clientPhone.trim(),

        age: Number(age),
        gender,

        occupation: occupation.trim(),
        location: location.trim(),

        presentingConcern:
          presentingConcern.trim(),

        history: history.trim(),
        notes: notes.trim(),

        consentAgreed: true,
        timezone: clientTimezone,
      };

      const bookingResponse =
        await axiosInstance.post(
          "/scheduling/book",
          bookingPayload
        );

      const bookedSession =
        bookingResponse.data?.session;

      if (
        !bookedSession?.id ||
        !bookedSession?.client?.id
      ) {
        throw new Error(
          "The session was created, but required client information was not returned."
        );
      }

      const razorpayLoaded =
        await loadRazorpayScript();

      if (
        !razorpayLoaded ||
        !window.Razorpay
      ) {
        throw new Error(
          "Razorpay could not be loaded. Please check your internet connection."
        );
      }

      const orderPayload = {
        therapistId: therapist._id,
        clientId: bookedSession.client.id,
        sessionId: bookedSession.id,
      };

      if (selectedPackage) {
        orderPayload.packageId =
          selectedPackage._id;
      }

      const orderResponse =
        await axiosInstance.post(
          "/payments/public/order",
          orderPayload
        );

      const orderData = orderResponse.data;

      if (!orderData?.orderId) {
        throw new Error(
          orderData?.message ||
            "Unable to create the payment order."
        );
      }

      if (!orderData?.keyId) {
        throw new Error(
          "Razorpay test key is not configured on the server."
        );
      }

      const razorpayOptions = {
        key: orderData.keyId,

        amount: orderData.amount,

        currency:
          orderData.currency || "INR",

        name: "UNFAZED",

        description: selectedPackage
          ? `${selectedPackage.name} - ${selectedPackage.sessionCount} sessions`
          : `Single therapy session with ${therapist.name}`,

        order_id: orderData.orderId,

        prefill: {
          name:
            bookedSession.clientName ||
            clientName.trim(),

          email:
            bookedSession.clientEmail ||
            clientEmail.trim().toLowerCase(),

          contact:
            bookedSession.clientPhone ||
            clientPhone.trim(),
        },

        notes: {
          therapist: therapist.name,

          sessionId: bookedSession.id,

          paymentType: selectedPackage
            ? "package"
            : "single-session",
        },

        theme: {
          color: "#7c6ee6",
        },

        handler: async (razorpayResponse) => {
          try {
            setBookingLoading(true);
            setBookingError("");

            const verifyResponse =
              await axiosInstance.post(
                "/payments/public/verify",
                {
                  razorpay_order_id:
                    razorpayResponse.razorpay_order_id,

                  razorpay_payment_id:
                    razorpayResponse.razorpay_payment_id,

                  razorpay_signature:
                    razorpayResponse.razorpay_signature,

                  paymentDbId:
                    orderData.paymentId,
                }
              );

            const paymentData =
              verifyResponse.data?.payment || {};

            setBookingConfirmation({
              ...bookedSession,

              payment: {
                ...paymentData,

                razorpayOrderId:
                  razorpayResponse.razorpay_order_id,

                razorpayPaymentId:
                  razorpayResponse.razorpay_payment_id,

                amount:
                  paymentData.amount ||
                  selectedPaymentAmount,

                paymentType: selectedPackage
                  ? "package"
                  : "single-session",

                paymentLabel:
                  selectedPaymentLabel,

                invoiceUrl:
                  paymentData.invoiceUrl ||
                  paymentData.invoice_url ||
                  null,
              },
            });

            setIsModalOpen(false);
            setSelectedSlot(null);

            await fetchSlots(
              date,
              therapist._id
            );
          } catch (error) {
            console.error(
              "Payment verification failed:",
              error
            );

            setBookingError(
              error.response?.data?.message ||
                error.message ||
                "Payment verification failed. Please contact the therapist if money was deducted."
            );
          } finally {
            setBookingLoading(false);
          }
        },

        modal: {
          ondismiss: () => {
            setBookingLoading(false);

            setBookingError(
              "Payment was cancelled. Your session was created, but payment was not completed."
            );
          },
        },
      };

      const razorpayCheckout =
        new window.Razorpay(
          razorpayOptions
        );

      razorpayCheckout.on(
        "payment.failed",
        (response) => {
          console.error(
            "Razorpay payment failed:",
            response
          );

          setBookingLoading(false);

          setBookingError(
            response?.error?.description ||
              "Payment failed. Please try again."
          );
        }
      );

      razorpayCheckout.open();
    } catch (error) {
      console.error(
        "Booking/payment error:",
        error
      );

      setBookingError(
        error.response?.data?.message ||
          error.message ||
          "Unable to complete the booking and payment."
      );

      setBookingLoading(false);
    }
  };

  /* =====================================================
     BOOK ANOTHER
     ===================================================== */

  const handleBookAnother = () => {
    setBookingConfirmation(null);
    setSelectedSlot(null);
    setBookingError("");

    resetForm();

    if (therapist?._id) {
      fetchSlots(date, therapist._id);
    }
  };

  /* =====================================================
     LOADING
     ===================================================== */

  if (loadingTherapist) {
    return (
      <div className="booking-page">
        <div className="booking-loading-card">
          <div className="booking-spinner"></div>

          <p>
            Loading therapist profile...
          </p>
        </div>
      </div>
    );
  }

  /* =====================================================
     ERROR
     ===================================================== */

  if (therapistError) {
    return (
      <div className="booking-page">
        <div className="booking-error-card">
          <h2>
            Unable to load therapist
          </h2>

          <p>{therapistError}</p>

          <button
            type="button"
            className="return-profile-btn"
            onClick={fetchTherapist}
          >
            Try Again
          </button>

          <br />

          <Link
            to="/"
            className="back-link"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!therapist) {
    return (
      <div className="booking-page">
        <div className="booking-error-card">
          <h2>
            Therapist not found
          </h2>

          <p>
            The therapist profile you are looking for
            could not be found.
          </p>

          <Link
            to="/"
            className="return-profile-btn"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  /* =====================================================
     MAIN PAGE
     ===================================================== */

  return (
    <div className="booking-page">
      <div className="booking-container">

        <div className="booking-top-nav">
          <Link
            to="/"
            className="back-link"
          >
            ← Back to Home
          </Link>
        </div>

        {!bookingConfirmation ? (
          <>
            <div className="therapist-summary-header">
              <div className="therapist-mini-avatar">
                {therapist.profileImage ? (
                  <img
                    src={therapist.profileImage}
                    alt={therapist.name}
                  />
                ) : (
                  therapist.name
                    ?.charAt(0)
                    ?.toUpperCase() || "T"
                )}
              </div>

              <div>
                <p className="booking-subtitle-label">
                  THERAPIST
                </p>

                <h1>
                  {therapist.name}
                </h1>

                <p className="therapist-specialties-text">
                  {therapist.qualification ||
                    therapist.specializations?.join(
                      ", "
                    ) ||
                    "Therapy Services"}
                </p>
              </div>
            </div>

            <div className="booking-card">

              <div className="booking-controls-grid">

                <div className="control-group">
                  <label htmlFor="booking-date">
                    Select Date
                  </label>

                  <input
                    id="booking-date"
                    type="date"
                    min={today}
                    value={date}
                    onChange={handleDateChange}
                  />
                </div>

                <div className="control-group">
                  <label>
                    Your Timezone
                  </label>

                  <select
                    value={clientTimezone}
                    onChange={(event) =>
                      setClientTimezone(
                        event.target.value
                      )
                    }
                  >
                    {TIMEZONES.map(
                      (timezone) => (
                        <option
                          key={timezone}
                          value={timezone}
                        >
                          {timezone}
                        </option>
                      )
                    )}
                  </select>
                </div>

              </div>

              <div className="slots-section-header">

                <h2>
                  Available Slots
                </h2>

                <span className="slots-tz-badge">
                  {clientTimezone}
                </span>

              </div>

              {loadingSlots ? (
                <div className="select-date-prompt">
                  <span className="prompt-icon">
                    ⏳
                  </span>

                  <p>
                    Checking available slots...
                  </p>
                </div>
              ) : slotsError ? (
                <div className="no-slots">
                  <p>
                    {slotsError}
                  </p>

                  <button
                    type="button"
                    className="secondary-nav-btn"
                    onClick={() =>
                      fetchSlots(
                        date,
                        therapist._id
                      )
                    }
                  >
                    Try Again
                  </button>
                </div>
              ) : slots.length === 0 ? (
                <div className="select-date-prompt">
                  <span className="prompt-icon">
                    📅
                  </span>

                  <p>
                    No available slots for this date.
                    Please select another date.
                  </p>
                </div>
              ) : (
                <div className="slots-grid">

                  {slots.map((slot) => {

                    /*
                     * CRITICAL FIX:
                     * Compare startTime only.
                     * Never compare possibly undefined
                     * id/_id values.
                     */

                    const isSelected =
                      selectedSlot?.startTime ===
                      slot.startTime;

                    const slotDuration =
                      getSlotDuration(slot);

                    const isAvailable =
                      slot.available !== false;

                    return (
                      <button
                        type="button"
                        key={slot.startTime}
                        className={
                          isSelected
                            ? "slot-button selected"
                            : "slot-button"
                        }
                        disabled={!isAvailable}
                        onClick={() =>
                          handleSlotSelect(slot)
                        }
                      >
                        <span className="slot-time-range">

                          {formatTime(
                            slot.startTime,
                            clientTimezone
                          )}

                          {" - "}

                          {formatTime(
                            slot.endTime,
                            clientTimezone
                          )}

                        </span>

                        <span className="slot-check">
                          {slotDuration} min
                        </span>
                      </button>
                    );
                  })}

                </div>
              )}

              {selectedSlot && (
                <div className="selected-slot-banner">

                  <div className="selected-slot-info">

                    <span className="selected-label">
                      SELECTED SLOT
                    </span>

                    <strong>
                      {formatDate(
                        selectedSlot.startTime
                      )}
                    </strong>

                    <strong>
                      {formatTime(
                        selectedSlot.startTime,
                        clientTimezone
                      )}

                      {" - "}

                      {formatTime(
                        selectedSlot.endTime,
                        clientTimezone
                      )}
                    </strong>

                  </div>

                  <button
                    type="button"
                    className="continue-booking-btn"
                    onClick={
                      handleContinueBooking
                    }
                  >
                    Continue Booking
                  </button>

                </div>
              )}

            </div>
          </>
        ) : (
          <div className="confirmation-card">

            <div className="confirmation-badge">
              ✓
            </div>

            <h2>
              Booking Confirmed
            </h2>

            <p className="confirmation-desc">
              Your therapy session has been
              successfully booked and paid.
            </p>

            <div className="confirmation-details-box">

              <div className="confirmation-detail-item">
                <span>
                  Date
                </span>

                <strong>
                  {formatDate(
                    bookingConfirmation.startTime
                  )}
                </strong>
              </div>

              <div className="confirmation-detail-item">
                <span>
                  Time
                </span>

                <strong>
                  {formatTime(
                    bookingConfirmation.startTime,
                    bookingConfirmation.timezone ||
                      clientTimezone
                  )}
                </strong>
              </div>

              <div className="confirmation-detail-item">
                <span>
                  Therapist
                </span>

                <strong>
                  {therapist.name}
                </strong>
              </div>

              <div className="confirmation-detail-item">
                <span>
                  Client
                </span>

                <strong>
                  {bookingConfirmation.clientName ||
                    clientName}
                </strong>
              </div>

              <div className="confirmation-detail-item">
                <span>
                  Payment Plan
                </span>

                <strong>
                  {bookingConfirmation.payment
                    ?.paymentLabel ||
                    "Single Session"}
                </strong>
              </div>

              <div className="confirmation-detail-item">
                <span>
                  Amount Paid
                </span>

                <strong>
                  {formatCurrency(
                    bookingConfirmation.payment
                      ?.amount
                  )}
                </strong>
              </div>

              <div className="confirmation-detail-item">
                <span>
                  Payment ID
                </span>

                <code>
                  {bookingConfirmation.payment
                    ?.razorpayPaymentId ||
                    "Completed"}
                </code>
              </div>

              {bookingConfirmation.payment
                ?.invoiceUrl && (
                <div className="confirmation-detail-item">

                  <span>
                    Invoice
                  </span>

                  <a
                    href={
                      bookingConfirmation.payment
                        .invoiceUrl
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="back-link"
                  >
                    View Invoice
                  </a>

                </div>
              )}

            </div>

            <div className="confirmation-actions">

              <button
                type="button"
                className="confirm-another-btn"
                onClick={
                  handleBookAnother
                }
              >
                Book Another Session
              </button>

              <Link
                to="/"
                className="return-profile-btn"
              >
                Back to Home
              </Link>

            </div>

          </div>
        )}

        {/* =================================================
            BOOKING MODAL
            ================================================= */}

        {isModalOpen && selectedSlot && (
          <div
            className="modal-backdrop"
            onMouseDown={(event) => {
              if (
                event.target ===
                  event.currentTarget &&
                !bookingLoading
              ) {
                handleCloseModal();
              }
            }}
          >

            <div className="booking-modal-card">

              <div className="modal-header">

                <div>
                  <p className="modal-label">
                    YOUR APPOINTMENT
                  </p>

                  <h2>
                    Complete Your Booking
                  </h2>
                </div>

                <button
                  type="button"
                  className="close-modal-btn"
                  onClick={
                    handleCloseModal
                  }
                  disabled={bookingLoading}
                >
                  ✕
                </button>

              </div>

              <div className="modal-slot-summary">

                <p>
                  <strong>
                    Date:
                  </strong>{" "}

                  {formatDate(
                    selectedSlot.startTime
                  )}
                </p>

                <p>
                  <strong>
                    Time:
                  </strong>{" "}

                  {formatTime(
                    selectedSlot.startTime,
                    clientTimezone
                  )}

                  {" - "}

                  {formatTime(
                    selectedSlot.endTime,
                    clientTimezone
                  )}
                </p>

                <p>
                  <strong>
                    Timezone:
                  </strong>{" "}

                  {clientTimezone}
                </p>

              </div>

              {bookingError && (
                <div className="modal-error-alert">
                  {bookingError}
                </div>
              )}

              <form
                className="modal-form"
                onSubmit={
                  handleConfirmBooking
                }
              >

                <div className="form-group">

                  <label htmlFor="client-name">
                    Full Name *
                  </label>

                  <input
                    id="client-name"
                    type="text"
                    value={clientName}
                    onChange={(event) =>
                      setClientName(
                        event.target.value
                      )
                    }
                    placeholder="Enter your full name"
                    disabled={bookingLoading}
                  />

                </div>

                <div className="form-group">

                  <label htmlFor="client-email">
                    Email Address *
                  </label>

                  <input
                    id="client-email"
                    type="email"
                    value={clientEmail}
                    onChange={(event) =>
                      setClientEmail(
                        event.target.value
                      )
                    }
                    placeholder="you@example.com"
                    disabled={bookingLoading}
                  />

                </div>

                <div className="form-group">

                  <label htmlFor="client-phone">
                    Phone Number *
                  </label>

                  <input
                    id="client-phone"
                    type="tel"
                    value={clientPhone}
                    onChange={(event) =>
                      setClientPhone(
                        event.target.value
                      )
                    }
                    placeholder="Enter your phone number"
                    disabled={bookingLoading}
                  />

                </div>

                <div className="form-group">

                  <label htmlFor="client-age">
                    Age *
                  </label>

                  <input
                    id="client-age"
                    type="number"
                    min="1"
                    max="120"
                    value={age}
                    onChange={(event) =>
                      setAge(
                        event.target.value
                      )
                    }
                    placeholder="Enter your age"
                    disabled={bookingLoading}
                  />

                </div>

                <div className="form-group">

                  <label htmlFor="client-gender">
                    Gender *
                  </label>

                  <select
                    id="client-gender"
                    value={gender}
                    onChange={(event) =>
                      setGender(
                        event.target.value
                      )
                    }
                    disabled={bookingLoading}
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

                  </select>

                </div>

                <div className="form-group">

                  <label htmlFor="client-occupation">
                    Occupation *
                  </label>

                  <input
                    id="client-occupation"
                    type="text"
                    value={occupation}
                    onChange={(event) =>
                      setOccupation(
                        event.target.value
                      )
                    }
                    placeholder="Student, Engineer, Teacher..."
                    disabled={bookingLoading}
                  />

                </div>

                <div className="form-group">

                  <label htmlFor="client-location">
                    Location *
                  </label>

                  <input
                    id="client-location"
                    type="text"
                    value={location}
                    onChange={(event) =>
                      setLocation(
                        event.target.value
                      )
                    }
                    placeholder="City / Location"
                    disabled={bookingLoading}
                  />

                </div>

                <div className="form-group">

                  <label htmlFor="presenting-concern">
                    Main Concern *
                  </label>

                  <textarea
                    id="presenting-concern"
                    value={presentingConcern}
                    onChange={(event) =>
                      setPresentingConcern(
                        event.target.value
                      )
                    }
                    placeholder="Briefly describe what you would like help with..."
                    disabled={bookingLoading}
                  />

                </div>

                <div className="form-group">

                  <label htmlFor="client-history">
                    Relevant History
                  </label>

                  <textarea
                    id="client-history"
                    value={history}
                    onChange={(event) =>
                      setHistory(
                        event.target.value
                      )
                    }
                    placeholder="Any relevant background information..."
                    disabled={bookingLoading}
                  />

                </div>

                <div className="form-group">

                  <label htmlFor="client-notes">
                    Additional Notes
                  </label>

                  <textarea
                    id="client-notes"
                    value={notes}
                    onChange={(event) =>
                      setNotes(
                        event.target.value
                      )
                    }
                    placeholder="Anything else you would like the therapist to know..."
                    disabled={bookingLoading}
                  />

                </div>

                {/* PAYMENT OPTIONS */}

                <div className="form-group payment-option-group">

                  <label htmlFor="payment-option">
                    Choose Payment Option *
                  </label>

                  <select
                    id="payment-option"
                    value={
                      selectedPaymentOption
                    }
                    onChange={(event) =>
                      setSelectedPaymentOption(
                        event.target.value
                      )
                    }
                    disabled={
                      bookingLoading ||
                      packagesLoading
                    }
                  >

                    <option value="single">
                      Single Session - ₹900
                    </option>

                    {packages.map(
                      (pkg) => (
                        <option
                          key={pkg._id}
                          value={pkg._id}
                        >
                          {pkg.name} -{" "}
                          {pkg.sessionCount}{" "}
                          sessions -{" "}
                          {formatCurrency(
                            pkg.totalPrice
                          )}
                        </option>
                      )
                    )}

                  </select>

                  {!packagesLoading &&
                    packages.length === 0 && (
                      <small className="package-load-note">
                        Single Session is available.
                        Therapist packages are
                        currently unavailable.
                      </small>
                    )}

                </div>

                {/* PAYMENT SUMMARY */}

                <div className="payment-summary">

                  <div>

                    <span>
                      Selected Plan
                    </span>

                    <strong>
                      {selectedPaymentLabel}
                    </strong>

                  </div>

                  <div>

                    <span>
                      Total
                    </span>

                    <strong>
                      {formatCurrency(
                        selectedPaymentAmount
                      )}
                    </strong>

                  </div>

                </div>

                {/* CONSENT */}

                <label className="consent-checkbox">

                  <input
                    type="checkbox"
                    checked={
                      consentAgreed
                    }
                    onChange={(event) =>
                      setConsentAgreed(
                        event.target.checked
                      )
                    }
                    disabled={bookingLoading}
                  />

                  <span>
                    I agree to provide the
                    information above for the
                    purpose of receiving therapy
                    services and scheduling this
                    appointment. *
                  </span>

                </label>

                {/* ACTIONS */}

                <div className="modal-actions">

                  <button
                    type="button"
                    className="modal-cancel-btn"
                    onClick={
                      handleCloseModal
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

                    {bookingLoading ? (
                      <>
                        <span className="button-spinner"></span>
                        Processing...
                      </>
                    ) : (
                      `Book & Pay ${formatCurrency(
                        selectedPaymentAmount
                      )}`
                    )}

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