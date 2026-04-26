import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Calendar,
  Clock,
  CreditCard,
  UserPlus,
  LogOut,
  Trash2,
  Home,
  Menu,
  X,
  Settings,
  Crown,
  BarChart3,
} from "lucide-react";
import { logoutCurrentUser } from "../../services/api";
import api from "../../services/api";
import Button from "../ui/Button";
import primuxFavicon from "../../assets/PrimuxCareFavicon.png";

const ACTIVE_PAYSTACK_STATUSES = ["active", "attention", "success"];

function NavItem({
  icon: Icon,
  label,
  path,
  danger,
  badge,
  location,
  onNavigate,
}) {
  const NavIcon = Icon;
  const active =
    location.pathname === path.split("?")[0] &&
    (path.includes("tab=trash")
      ? location.search.includes("tab=trash")
      : !location.search.includes("tab=trash"));

  return (
    <button
      onClick={() => onNavigate(path)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 mt-1 font-medium ${
        active && !danger
          ? "bg-primary-50 text-primary-700 shadow-sm"
          : danger
            ? "text-red-600 hover:bg-red-50 hover:text-red-700"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      <NavIcon
        size={20}
        className={active && !danger ? "text-primary-600" : ""}
      />
      {label}
      {badge !== undefined && badge > 0 && (
        <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center justify-center min-w-[20px] shadow-sm">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </button>
  );
}

export default function DashboardLayout() {
  const MotionDiv = motion.div;
  const MotionAside = motion.aside;
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [appointmentCount, setAppointmentCount] = useState(0);
  const [waitingCount, setWaitingCount] = useState(0);
  const [showTrialBanner, setShowTrialBanner] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const storedUser =
    JSON.parse(
      localStorage.getItem("user") || sessionStorage.getItem("user"),
    ) || {};
  const user = {
    name: storedUser.name || storedUser.email || "User",
    role: storedUser.role || "nurse",
    clinicName: storedUser.clinic?.name || "Clinic",
  };

  const clinicPlan = storedUser.clinic?.plan || "FREE";
  const subscriptionEnds = storedUser.clinic?.subscriptionEnds;
  const paystackSubscriptionStatus = String(
    storedUser.clinic?.paystackSubscriptionStatus || "",
  ).toLowerCase();
  const hasActivePaidSubscription = ACTIVE_PAYSTACK_STATUSES.includes(
    paystackSubscriptionStatus,
  );
  let remainingTrialDays = 0;
  let remainingPaidDays = 0;

  if (clinicPlan === "PRO" && subscriptionEnds) {
    const end = new Date(subscriptionEnds);
    const now = new Date();
    const days = Math.max(
      0,
      Math.ceil((end - now) / (1000 * 60 * 60 * 24)),
    );
    if (!hasActivePaidSubscription) {
      remainingTrialDays = days;
    } else {
      remainingPaidDays = days;
    }
  }

  useEffect(() => {
    if (
      clinicPlan !== "PRO" ||
      hasActivePaidSubscription ||
      remainingTrialDays <= 0
    )
      return;

    let hideTimer;
    const showTimer = setTimeout(() => {
      setShowTrialBanner(true);

      if (remainingTrialDays > 3) {
        hideTimer = setTimeout(() => {
          setShowTrialBanner(false);
          setBannerDismissed(true);
        }, 10000);
      }
    }, 2000);

    return () => {
      clearTimeout(showTimer);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [clinicPlan, remainingTrialDays, hasActivePaidSubscription]);

  const canViewRecords = ["admin", "doctor", "nurse"].includes(user.role);

  useEffect(() => {
    const fetchCounts = async () => {
      if (!canViewRecords) return;
      try {
        const resApt = await api.get(`/appointments?status=scheduled`);
        setAppointmentCount(resApt.data.length || 0);

        const resWait = await api.get(`/waiting-room`);
        const activeWaiting = (resWait.data || []).filter(
          (item) => item.status === "waiting" || item.status === "called",
        );
        setWaitingCount(activeWaiting.length);
      } catch {
        // ignore for badges
      }
    };

    fetchCounts();
    const intervalId = setInterval(fetchCounts, 15000);
    return () => clearInterval(intervalId);
  }, [location.pathname, canViewRecords]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    await logoutCurrentUser();
    navigate("/login");
  };

  const handleNavClick = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  // Determine header title based on pathname
  let headerTitle = "Overview";
  if (location.pathname.includes("/register-patient"))
    headerTitle = "Register Patient";
  else if (location.pathname.includes("/appointments"))
    headerTitle = "Appointments";
  else if (location.pathname.includes("/waiting-room"))
    headerTitle = "Waiting Room";
  else if (location.pathname.includes("/billing")) headerTitle = "Billing";
  else if (location.pathname.includes("/signup")) headerTitle = "Manage Staff";
  else if (location.pathname.includes("/clinic-settings"))
    headerTitle = "Clinic Settings";
  else if (location.pathname.includes("/patients/"))
    headerTitle = "Patient Record";
  else if (location.pathname.includes("/upgrade")) headerTitle = "Upgrade Plan";
  else if (location.pathname.includes("/reports"))
    headerTitle = "Advanced Analytics";

  if (location.search.includes("tab=trash")) headerTitle = "Trash Management";

  return (
    <div className="flex h-screen bg-surface-50 font-sans overflow-hidden">
      <AnimatePresence>
        {mobileMenuOpen && (
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      <MotionAside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-surface-200 flex flex-col transition-transform duration-300 lg:translate-x-0 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:relative lg:flex"}`}
      >
        <div className="flex items-center justify-between p-6 h-20 border-b border-surface-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 p-1 shadow-inner shadow-primary-800/30">
              <img
                src={primuxFavicon}
                alt="PrimuxCare logo"
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <span className="font-bold text-slate-900 tracking-tight block leading-4">
                PrimuxCare
              </span>
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">
                {user.clinicName}
              </span>
            </div>
          </div>
          <button
            className="lg:hidden text-slate-500"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Main Menu
            </p>
            <NavItem
              icon={Home}
              label="Dashboard"
              path="/dashboard"
              location={location}
              onNavigate={handleNavClick}
            />
            {canViewRecords && (
              <>
                <NavItem
                  icon={UserPlus}
                  label="Register Patient"
                  path="/register-patient"
                  location={location}
                  onNavigate={handleNavClick}
                />
                <NavItem
                  icon={Calendar}
                  label="Appointments"
                  path="/appointments"
                  badge={appointmentCount}
                  location={location}
                  onNavigate={handleNavClick}
                />
                <NavItem
                  icon={Clock}
                  label="Waiting Room"
                  path="/waiting-room"
                  badge={waitingCount}
                  location={location}
                  onNavigate={handleNavClick}
                />
                <NavItem
                  icon={CreditCard}
                  label="Billing"
                  path="/billing"
                  location={location}
                  onNavigate={handleNavClick}
                />
                <NavItem
                  icon={BarChart3}
                  label="Reports"
                  path="/reports"
                  location={location}
                  onNavigate={handleNavClick}
                />
              </>
            )}
          </div>

          {user.role === "admin" && (
            <div>
              <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Administration
              </p>
              <NavItem
                icon={Users}
                label="Manage Staff"
                path="/signup"
                location={location}
                onNavigate={handleNavClick}
              />
              <NavItem
                icon={Settings}
                label="Clinic Settings"
                path="/clinic-settings"
                location={location}
                onNavigate={handleNavClick}
              />
              <NavItem
                icon={Trash2}
                label="Trash"
                path="/dashboard?tab=trash"
                location={location}
                onNavigate={handleNavClick}
              />
            </div>
          )}

          <div>
            <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              SaaS Plan
            </p>
            <NavItem
              icon={Crown}
              label="Upgrade Plan"
              path="/upgrade"
              location={location}
              onNavigate={handleNavClick}
            />
          </div>
        </div>

        <div className="p-4 border-t border-surface-100 bg-surface-50 shrink-0">
          <div className="flex items-center gap-3 px-4 py-2 mb-2">
            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold border border-primary-200">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 truncate">
              <p className="text-sm font-semibold text-slate-900 truncate">
                {user.name}
              </p>
              <p className="text-xs text-slate-500 capitalize">{user.role}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start pl-4 text-slate-600 hover:text-red-600 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut size={18} className="mr-3" /> Sign Out
          </Button>
        </div>
      </MotionAside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-surface-50/50">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-surface-200 flex items-center justify-between px-6 z-10 shrink-0 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              className="p-2 rounded-lg bg-white border border-surface-200 text-slate-600 lg:hidden hover:bg-surface-50"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu size={20} />
            </button>
            <h1 className="text-xl font-semibold text-slate-800">
              {headerTitle}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 pl-4 text-sm font-medium text-slate-600 bg-white border border-surface-200 px-4 py-2 rounded-full shadow-sm">
              <Clock size={16} className="text-primary-500 hidden sm:block" />
              {currentTime.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                timeZoneName: "short"
              })}
            </div>
          </div>
        </header>

        <AnimatePresence>
          {clinicPlan === "PRO" &&
            remainingTrialDays > 0 &&
            !hasActivePaidSubscription &&
            showTrialBanner && (
              <MotionDiv
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                className={`text-white px-4 py-2.5 text-center text-sm font-bold shadow-sm shrink-0 relative z-10 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 overflow-hidden ${
                  remainingTrialDays <= 3
                    ? "bg-gradient-to-r from-red-600 to-rose-600"
                    : "bg-gradient-to-r from-amber-500 to-orange-500"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Crown size={18} />
                  {remainingTrialDays <= 3 ? "URGENT: " : ""}You have{" "}
                  {remainingTrialDays} days left on your Free Pro Trial.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate("/upgrade")}
                    className="bg-white/20 hover:bg-white/30 px-4 py-1.5 rounded-full text-xs transition-colors border border-white/30 backdrop-blur-sm shadow-sm focus:outline-none"
                  >
                    Upgrade Now
                  </button>
                  {remainingTrialDays > 3 && (
                    <button
                      onClick={() => {
                        setShowTrialBanner(false);
                        setBannerDismissed(true);
                      }}
                      className="bg-white/20 hover:bg-white/30 p-1.5 rounded-full text-xs transition-colors focus:outline-none ml-2"
                      aria-label="Dismiss banner"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </MotionDiv>
            )}
        </AnimatePresence>

        {clinicPlan === "PRO" &&
          hasActivePaidSubscription &&
          subscriptionEnds &&
          remainingPaidDays <= 7 && (
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2.5 text-center text-sm font-bold shadow-sm shrink-0 relative z-10 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
              <span className="flex items-center gap-2">
                <Crown size={18} /> Pro Plan renews in {remainingPaidDays} {remainingPaidDays === 1 ? "day" : "days"} (
                {new Date(subscriptionEnds).toLocaleDateString("en-NG", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}).
              </span>
              <button
                onClick={() => navigate("/upgrade")}
                className="bg-white/20 hover:bg-white/30 px-4 py-1.5 rounded-full text-xs transition-colors border border-white/30 backdrop-blur-sm shadow-sm"
              >
                Manage Billing
              </button>
            </div>
          )}

        <div className="flex-1 overflow-y-auto w-full relative">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
