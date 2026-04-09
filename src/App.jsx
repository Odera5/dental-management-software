import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import RegisterClinic from "./pages/RegisterClinic";
import Signup from "./pages/Signup";
import ClinicSettings from "./pages/ClinicSettings";
import Dashboard from "./pages/Dashboard";
import RegisterPatient from "./pages/RegisterPatient";
import PatientRecord from "./pages/PatientRecord";
import Appointments from "./pages/Appointments";
import Billing from "./pages/Billing";
import WaitingRoom from "./pages/WaitingRoom";
import Support from "./pages/Support";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <Routes>
        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register-clinic" element={<RegisterClinic />} />
        <Route path="/support" element={<Support />} />
        <Route
          path="/signup"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Signup />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clinic-settings"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <ClinicSettings />
            </ProtectedRoute>
          }
        />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/register-patient"
          element={
            <ProtectedRoute>
              <RegisterPatient />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patients/:id/records"
          element={
            <ProtectedRoute>
              <PatientRecord />
            </ProtectedRoute>
          }
        />
        <Route
          path="/appointments"
          element={
            <ProtectedRoute>
              <Appointments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/waiting-room"
          element={
            <ProtectedRoute>
              <WaitingRoom />
            </ProtectedRoute>
          }
        />
        <Route
          path="/billing"
          element={
            <ProtectedRoute>
              <Billing />
            </ProtectedRoute>
          }
        />

        {/* Fallback for unknown routes */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
