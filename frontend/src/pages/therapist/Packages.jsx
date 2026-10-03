
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";

const initialForm = {
  name: "",
  description: "",
  sessionCount: "3",
  totalPrice: "",
  validityDays: "90",
};

const styles = {
  page: {
    minHeight: "100vh",
    padding: "32px",
    background: "#f5f7fb",
    fontFamily: "Arial, sans-serif",
    color: "#263348",
  },
  container: {
    maxWidth: "1100px",
    margin: "0 auto",
  },
  back: {
    background: "transparent",
    border: "none",
    color: "#5264a5",
    cursor: "pointer",
    marginBottom: "24px",
    padding: 0,
    fontSize: "15px",
  },
  card: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "24px",
    marginBottom: "24px",
    boxShadow: "0 4px 18px rgba(30, 45, 75, 0.06)",
  },
  label: {
    display: "block",
    fontWeight: 600,
    marginBottom: "8px",
    fontSize: "14px",
  },
  input: {
    width: "100%",
    padding: "12px",
    border: "1px solid #d8deea",
    borderRadius: "8px",
    fontSize: "15px",
    boxSizing: "border-box",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
    gap: "18px",
    marginBottom: "18px",
  },
  button: {
    background: "#5264a5",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "12px 22px",
    fontSize: "15px",
    fontWeight: 600,
    cursor: "pointer",
  },
};

function Packages() {
  const navigate = useNavigate();

  const [packages, setPackages] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadPackages = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axiosInstance.get(
        "/payments/packages"
      );

      setPackages(response.data.packages || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load packages."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPackages();
  }, [loadPackages]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const totalPrice = Number(form.totalPrice);
    const validityDays = Number(form.validityDays);
    const sessionCount = Number(form.sessionCount);

    if (!form.name.trim()) {
      setError("Please enter a package name.");
      return;
    }

    if (![3, 6, 12].includes(sessionCount)) {
      setError("Select 3, 6, or 12 sessions.");
      return;
    }

    if (!Number.isFinite(totalPrice) || totalPrice <= 0) {
      setError("Enter a valid package price.");
      return;
    }

    if (
      !Number.isInteger(validityDays) ||
      validityDays <= 0
    ) {
      setError("Enter a valid expiry period in days.");
      return;
    }

    try {
      setSubmitting(true);

      await axiosInstance.post("/payments/packages", {
        name: form.name.trim(),
        description: form.description.trim(),
        sessionCount,
        totalPrice,
        validityDays,
      });

      setSuccess("Package created successfully.");
      setForm(initialForm);

      await loadPackages();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to create package."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(amount) || 0);

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <button
          type="button"
          style={styles.back}
          onClick={() => navigate("/therapist/dashboard")}
        >
          ← Back to Dashboard
        </button>

        <header style={{ marginBottom: "28px" }}>
          <p
            style={{
              color: "#5264a5",
              fontWeight: 700,
              letterSpacing: "2px",
              fontSize: "12px",
            }}
          >
            UNFAZED · THERAPIST PORTAL
          </p>

          <h1 style={{ marginBottom: "8px" }}>
            Session Packages
          </h1>

          <p style={{ color: "#667085" }}>
            Create and manage prepaid therapy session
            packages for your clients.
          </p>
        </header>

        <section style={styles.card}>
          <h2 style={{ marginTop: 0 }}>
            Create a New Package
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={styles.grid}>
              <div>
                <label htmlFor="name" style={styles.label}>
                  Package name
                </label>

                <input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Example: Wellness Package"
                  maxLength={100}
                  required
                  style={styles.input}
                />
              </div>

              <div>
                <label
                  htmlFor="sessionCount"
                  style={styles.label}
                >
                  Number of sessions
                </label>

                <select
                  id="sessionCount"
                  name="sessionCount"
                  value={form.sessionCount}
                  onChange={handleChange}
                  style={styles.input}
                >
                  <option value="3">3 sessions</option>
                  <option value="6">6 sessions</option>
                  <option value="12">12 sessions</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="totalPrice"
                  style={styles.label}
                >
                  Total package price (₹)
                </label>

                <input
                  id="totalPrice"
                  name="totalPrice"
                  type="number"
                  min="1"
                  step="0.01"
                  value={form.totalPrice}
                  onChange={handleChange}
                  placeholder="Example: 3000"
                  required
                  style={styles.input}
                />
              </div>

              <div>
                <label
                  htmlFor="validityDays"
                  style={styles.label}
                >
                  Validity (days)
                </label>

                <input
                  id="validityDays"
                  name="validityDays"
                  type="number"
                  min="1"
                  step="1"
                  value={form.validityDays}
                  onChange={handleChange}
                  required
                  style={styles.input}
                />
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label
                htmlFor="description"
                style={styles.label}
              >
                Description (optional)
              </label>

              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe what this package includes..."
                rows={4}
                style={{
                  ...styles.input,
                  resize: "vertical",
                }}
              />
            </div>

            {form.totalPrice &&
              Number(form.totalPrice) > 0 && (
                <p
                  style={{
                    background: "#eef2ff",
                    padding: "14px",
                    borderRadius: "8px",
                  }}
                >
                  Price per session:{" "}
                  <strong>
                    {formatCurrency(
                      Number(form.totalPrice) /
                        Number(form.sessionCount)
                    )}
                  </strong>
                </p>
              )}

            {error && (
              <p role="alert" style={{ color: "#b42318" }}>
                {error}
              </p>
            )}

            {success && (
              <p
                role="status"
                style={{ color: "#067647" }}
              >
                {success}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                ...styles.button,
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting
                ? "Creating..."
                : "+ Create Package"}
            </button>
          </form>
        </section>

        <section>
          <h2>Existing Packages</h2>

          {loading ? (
            <p>Loading packages...</p>
          ) : packages.length === 0 ? (
            <div style={styles.card}>
              <p style={{ color: "#667085" }}>
                No active packages yet. Create your first
                package using the form above.
              </p>
            </div>
          ) : (
            <div style={styles.grid}>
              {packages.map((pkg) => (
                <article
                  key={pkg._id}
                  style={{
                    ...styles.card,
                    marginBottom: 0,
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      padding: "6px 12px",
                      background: "#e8f7ee",
                      color: "#167647",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  >
                    Active
                  </span>

                  <h3>{pkg.name}</h3>

                  {pkg.description && (
                    <p style={{ color: "#667085" }}>
                      {pkg.description}
                    </p>
                  )}

                  <p>
                    <strong>{pkg.sessionCount}</strong>{" "}
                    sessions
                  </p>

                  <p>
                    <strong>
                      {formatCurrency(pkg.totalPrice)}
                    </strong>{" "}
                    total
                  </p>

                  <p>
                    {formatCurrency(
                      pkg.perSessionRate
                    )}{" "}
                    per session
                  </p>

                  <p>
                    Valid for {pkg.validityDays} days
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default Packages;
