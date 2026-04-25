import React, { Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/layout/DashboardLayout";
import RoutePersistence from "./components/RoutePersistence";
import { readLastVisitedRoute } from "./utils/persistence";

const Login = lazy(() => import("./pages/Login"));
const RegisterClinic = lazy(() => import("./pages/RegisterClinic"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const Signup = lazy(() => import("./pages/Signup"));
const ClinicSettings = lazy(() => import("./pages/ClinicSettings"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const RegisterPatient = lazy(() => import("./pages/RegisterPatient"));
const PatientRecord = lazy(() => import("./pages/PatientRecord"));
const Appointments = lazy(() => import("./pages/Appointments"));
const Billing = lazy(() => import("./pages/Billing"));
const WaitingRoom = lazy(() => import("./pages/WaitingRoom"));
const Support = lazy(() => import("./pages/Support"));
const UpgradePlan = lazy(() => import("./pages/UpgradePlan"));
const Reports = lazy(() => import("./pages/Reports"));
const PatientIntakeForm = lazy(() => import("./pages/PatientIntakeForm"));
const PaystackCallback = lazy(() => import("./pages/PaystackCallback"));
const Waitlist = lazy(() => import("./pages/Waitlist"));

function RouteLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-50 px-4">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
    </div>
  );
}

const ProtectedLayout = () => (
  <ProtectedRoute>
    <DashboardLayout />
  </ProtectedRoute>
);

function HomeRedirect() {
  const token =
    localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
  const lastRoute = readLastVisitedRoute();
  const fallbackRoute = token ? lastRoute || "/dashboard" : "/login";

  return <Navigate to={fallbackRoute} replace />;
}

function App() {
  return (
    <Router>
      <RoutePersistence />
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          {/* Redirect root to login */}
          <Route path="/" element={<HomeRedirect />} />

          {/* Public routes */}
          <Route path="/waitlist" element={<Waitlist />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register-clinic" element={<RegisterClinic />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/billing/paystack/callback" element={<PaystackCallback />} />
          <Route path="/support" element={<Support />} />
          <Route path="/intake/:clinicId" element={<PatientIntakeForm />} />

          {/* Protected routes - wrapped with Sidebar Layout */}
          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/register-patient" element={<RegisterPatient />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/waiting-room" element={<WaitingRoom />} />
            <Route path="/billing" element={<Billing />} />
            <Route
              path="/upgrade"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <UpgradePlan />
                </ProtectedRoute>
              }
            />
            <Route path="/reports" element={<Reports />} />
            
            {/* Require admin/specific roles */}
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
            <Route
              path="/patients/:id/records"
              element={
                <ProtectedRoute allowedRoles={["admin", "doctor", "nurse"]}>
                  <PatientRecord />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Fallback for unknown routes */}
          <Route path="*" element={<HomeRedirect />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
