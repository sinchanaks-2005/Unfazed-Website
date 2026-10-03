import { Navigate, Route, Routes } from "react-router-dom";

import Login from "./pages/therapist/Login";
import Signup from "./pages/therapist/Signup";
import Dashboard from "./pages/therapist/Dashboard";
import Profile from "./pages/therapist/Profile";
import Sessions from "./pages/therapist/Sessions";
import Clients from "./pages/therapist/Clients";
import Availability from "./pages/therapist/Availability";
import Settings from "./pages/therapist/Settings";
import Packages from "./pages/therapist/Packages";
import Notes from "./pages/therapist/Notes";

import TherapistPublicProfile from "./pages/client/TherapistPublicProfile";
import BookingPage from "./pages/client/BookingPage";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>

      {/* Default */}
      <Route
        path="/"
        element={<Navigate to="/therapist/login" replace />}
      />

      {/* Public Therapist Auth */}
      <Route
        path="/therapist/login"
        element={<Login />}
      />

      <Route
        path="/therapist/signup"
        element={<Signup />}
      />

      {/* Public Branded Therapist Profile & Booking Routes */}
      <Route
        path="/therapist/:slug"
        element={<TherapistPublicProfile />}
      />

      <Route
        path="/therapist/:slug/book"
        element={<BookingPage />}
      />

      <Route
        path="/:slug/book"
        element={<BookingPage />}
      />

      <Route
        path="/:slug"
        element={<TherapistPublicProfile />}
      />

      {/* Protected Therapist Pages */}
      <Route
        path="/therapist/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/therapist/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/therapist/sessions"
        element={
          <ProtectedRoute>
            <Sessions />
          </ProtectedRoute>
        }
      />

      <Route
        path="/therapist/clients"
        element={
          <ProtectedRoute>
            <Clients />
          </ProtectedRoute>
        }
      />

      <Route
        path="/therapist/availability"
        element={
          <ProtectedRoute>
            <Availability />
          </ProtectedRoute>
        }
      />

      <Route
        path="/therapist/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />

      <Route
        path="/therapist/packages"
        element={
          <ProtectedRoute>
            <Packages />
          </ProtectedRoute>
        }
      />

      {/* Clinical Notes */}
      <Route
        path="/therapist/notes"
        element={
          <ProtectedRoute>
            <Notes />
          </ProtectedRoute>
        }
      />

      {/* Unknown URL */}
      <Route
        path="*"
        element={<Navigate to="/therapist/login" replace />}
      />

    </Routes>
  );
}

export default App;