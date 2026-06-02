import React, { Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import RoutePersistence from "./components/RoutePersistence";
import ErrorBoundary from "./components/ErrorBoundary";
import { readLastVisitedRoute } from "./utils/persistence";
import { getStoredUser } from "./utils/authStorage";

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
const BranchManagement = lazy(() => import("./pages/BranchManagement"));
const Reports = lazy(() => import("./pages/Reports"));
const PendingIntakes = lazy(() => import("./pages/PendingIntakes"));
const PatientIntakeForm = lazy(() => import("./pages/PatientIntakeForm"));
const PaystackCallback = lazy(() => import("./pages/PaystackCallback"));
const Waitlist = lazy(() => import("./pages/Waitlist"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const AppointmentResponse = lazy(() => import("./pages/AppointmentResponse"));
const DashboardLayout = lazy(() => import("./components/layout/DashboardLayout"));
const AuditLogs = lazy(() => import("./pages/AuditLogs"));

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
  const storedUser = getStoredUser();
  let user = null;

  try {
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch {
    user = null;
  }

  const lastRoute = readLastVisitedRoute(user);
  
  const fallbackRoute = storedUser ? lastRoute || "/dashboard" : "/login";

  return <Navigate to={fallbackRoute} replace />;
}

function App() {
  return (
    <Router>
      <ErrorBoundary>
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
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/appointment-response" element={<AppointmentResponse />} />
            <Route path="/billing/paystack/callback" element={<PaystackCallback />} />
            <Route path="/support" element={<Support />} />
            <Route path="/intake/:clinicId" element={<PatientIntakeForm />} />

            {/* Protected routes - wrapped with Sidebar Layout */}
            <Route element={<ProtectedLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/register-patient" element={<RegisterPatient />} />
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/waiting-room" element={<WaitingRoom />} />
              <Route path="/pending-intakes" element={<PendingIntakes />} />
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
                  <ProtectedRoute allowedRoles={["admin", "branch_manager"]}>
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
                path="/audit-logs"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AuditLogs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/branches"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <BranchManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patients/:id/records"
                element={
                  <ProtectedRoute allowedRoles={["admin", "branch_manager", "doctor", "nurse"]}>
                    <PatientRecord />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Fallback for unknown routes */}
            <Route path="*" element={<HomeRedirect />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
