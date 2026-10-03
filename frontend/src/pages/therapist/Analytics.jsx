import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import { useEntitlement } from "../../hooks/useEntitlement";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import "./Analytics.css";

function Analytics() {
  const {
    entitlements,
    loading: entitlementLoading,
    openUpgradeModal,
    upgradeModal,
    closeUpgradeModal,
  } = useEntitlement();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await axiosInstance.get("/analytics");
        setAnalytics(response.data);
      } catch (error) {
        if (error.response?.data?.upgradeRequired) {
          openUpgradeModal(
            "Advanced Analytics",
            error.response.data.requiredTier || "pro",
            error.response.data.message
          );
        } else {
          console.error(
            "Unable to load analytics:",
            error.response?.data?.message || error.message
          );
        }
      } finally {
        setLoading(false);
      }
    };

    if (!entitlementLoading) {
      fetchAnalytics();
    }
  }, [entitlementLoading, openUpgradeModal]);

  if (entitlementLoading || loading) {
    return (
      <div className="analytics-page">
        <h1>Analytics</h1>
        <p>Loading analytics...</p>
      </div>
    );
  }

  const analyticsDepth =
    entitlements?.features?.analyticsDepth || "basic";

  if (!analytics && upgradeModal.isOpen) {
    return (
      <div className="analytics-page">
        <div className="upgrade-prompt">
          <h1>Advanced Analytics</h1>

          <p>
            {upgradeModal.message ||
              "Advanced analytics are available on an upgraded subscription plan."}
          </p>

          <button type="button" onClick={closeUpgradeModal}>
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="analytics-page">
        <h1>Analytics</h1>
        <p>Analytics data is not available.</p>
      </div>
    );
  }

  const revenueData = analytics.revenueTrend || [];
  const clientData = analytics.clientTrend || [];
  const sessionData = analytics.sessionStatusDistribution || [];

  return (
    <div className="analytics-page">
      {/* Header */}
      <div className="analytics-header">
        <div>
          <h1>Practice Analytics</h1>

          <p>
            Subscription analytics depth:{" "}
            <strong>{analyticsDepth}</strong>
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="analytics-stats">
        <div className="analytics-card">
          <h3>Total Revenue</h3>
          <p>
            ₹
            {Number(
              analytics.summary?.totalRevenue || 0
            ).toLocaleString("en-IN")}
          </p>
        </div>

        <div className="analytics-card">
          <h3>Active Clients</h3>
          <p>{analytics.summary?.activeClients || 0}</p>
        </div>

        <div className="analytics-card">
          <h3>No-show Rate</h3>
          <p>{analytics.summary?.noShowRate || 0}%</p>
        </div>

        <div className="analytics-card">
          <h3>Total Sessions</h3>
          <p>{analytics.summary?.totalSessions || 0}</p>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="analytics-section">
        <h2>Revenue Trend</h2>

        {revenueData.length > 0 ? (
          <div className="analytics-chart">
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="period" />

                <YAxis
                  tickFormatter={(value) =>
                    `₹${Number(value).toLocaleString("en-IN")}`
                  }
                />

                <Tooltip
                  formatter={(value) =>
                    `₹${Number(value).toLocaleString("en-IN")}`
                  }
                />

                <Legend />

                <Line
                  type="monotone"
                  dataKey="totalRevenue"
                  name="Revenue"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p>No revenue data available yet.</p>
        )}
      </div>

      {/* New Clients Chart */}
      <div className="analytics-section">
        <h2>New Clients</h2>

        {clientData.length > 0 ? (
          <div className="analytics-chart">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={clientData}>
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="period" />

                <YAxis allowDecimals={false} />

                <Tooltip />

                <Legend />

                <Bar
                  dataKey="newClients"
                  name="New Clients"
                  fill="#16a34a"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p>No client trend data available yet.</p>
        )}
      </div>

      {/* Session Status Chart */}
      <div className="analytics-section">
        <h2>Session Status</h2>

        {sessionData.length > 0 ? (
          <div className="analytics-chart analytics-pie-chart">
            <ResponsiveContainer width="100%" height={340}>
              <PieChart>
                <Pie
                  data={sessionData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={110}
                  label
                >
                  {sessionData.map((entry, index) => (
                    <Cell
                      key={`session-cell-${index}`}
                      fill={
                        [
                          "#2563eb",
                          "#16a34a",
                          "#f59e0b",
                          "#dc2626",
                          "#7c3aed",
                        ][index % 5]
                      }
                    />
                  ))}
                </Pie>

                <Tooltip />

                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p>No session data available yet.</p>
        )}
      </div>

      {/* Revenue Details */}
      <div className="analytics-section">
        <h2>Revenue Details</h2>

        {revenueData.length > 0 ? (
          <div className="analytics-table">
            <div className="analytics-row analytics-heading">
              <span>Period</span>
              <span>Revenue</span>
              <span>Transactions</span>
            </div>

            {revenueData.map((item) => (
              <div
                className="analytics-row"
                key={item.period}
              >
                <span>{item.period}</span>

                <span>
                  ₹
                  {Number(
                    item.totalRevenue || 0
                  ).toLocaleString("en-IN")}
                </span>

                <span>
                  {item.transactionCount || 0}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p>No revenue details available.</p>
        )}
      </div>

      {/* Upgrade Modal */}
      {upgradeModal.isOpen && (
        <div className="upgrade-modal">
          <div className="upgrade-modal-content">
            <h2>Upgrade Required</h2>

            <p>{upgradeModal.message}</p>

            <button
              type="button"
              onClick={closeUpgradeModal}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Analytics;