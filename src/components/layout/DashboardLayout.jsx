import React, { useState, useEffect, useRef } from "react";
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
  Inbox,
  Building2,
  ChevronDown,
  Check,
  History,
} from "lucide-react";
import api, { logoutCurrentUser } from "../../services/api";
import {
  getDashboardSummary,
  readDashboardSummaryCache,
  subscribeDashboardSummary,
} from "../../services/dashboardSummary";
import Button from "../ui/Button";
import primuxFavicon from "../../assets/primux-logo.png";
import { getStoredUserObject, updateStoredUser } from "../../utils/authStorage";
import {
  BRANCHES_UPDATED_EVENT,
  getActiveBranchId,
  getAvailableBranches,
  setActiveBranch,
} from "../../utils/branchStorage";
import {
  hasActiveProAccess,
  hasActivePaidSubscription,
  isSubscriptionExpired,
  isTrialingClinic,
  getTrialDaysRemaining,
  hasEnterpriseAccess,
} from "../../utils/clinicAccess";

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
      className={`w-full flex items-center gap-2 px-3 py-3 rounded-xl transition-all duration-200 mt-1 font-medium text-sm ${
        active && !danger
          ? "bg-primary-50 text-primary-700 shadow-sm"
          : danger
            ? "text-red-600 hover:bg-red-50 hover:text-red-700"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      <NavIcon
        size={18}
        className={active && !danger ? "text-primary-600 shrink-0" : "shrink-0"}
      />
      <span className="whitespace-nowrap text-left flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="ml-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center justify-center min-w-[20px] shadow-sm shrink-0">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </button>
  );
}

const BRANCH_SWITCH_SAFE_ROUTES = [
  "/dashboard",
  "/register-patient",
  "/appointments",
  "/waiting-room",
  "/pending-intakes",
  "/billing",
  "/reports",
  "/signup",
  "/clinic-settings",
  "/branches",
  "/upgrade",
];

function getBranchSwitchDestination(pathname, search = "") {
  const isSafeRoute = BRANCH_SWITCH_SAFE_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (!isSafeRoute) {
    return "/dashboard";
  }

  return `${pathname}${search || ""}`;
}

export default function DashboardLayout() {
  const MotionDiv = motion.div;
  const MotionAside = motion.aside;
  const navigate = useNavigate();
  const location = useLocation();
  const cachedSummary = readDashboardSummaryCache().data;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [appointmentCount, setAppointmentCount] = useState(
    cachedSummary?.appointments?.scheduled || 0,
  );
  const [waitingCount, setWaitingCount] = useState(
    cachedSummary?.waitingRoom?.active || 0,
  );
  const [pendingIntakesCount, setPendingIntakesCount] = useState(
    cachedSummary?.intakes?.pending || 0,
  );
  const [showTrialBanner, setShowTrialBanner] = useState(false);
  const [clinicState, setClinicState] = useState(null);
  const [branchState, setBranchState] = useState(() => {
    const stored = getStoredUserObject() || {};
    return stored.branch || null;
  });
  const [availableBranches, setAvailableBranches] = useState(() =>
    getAvailableBranches(),
  );
  const [branchMenuOpen, setBranchMenuOpen] = useState(false);
  const branchMenuRef = useRef(null);

  const storedUser = getStoredUserObject() || {};
  const user = {
    name: storedUser.name || storedUser.email || "User",
    role: storedUser.role || "nurse",
    displayRole: storedUser.customRoleTitle || storedUser.role || "nurse",
    clinicName: clinicState?.name || storedUser.clinic?.name || "Clinic",
  };

  const clinic = clinicState || storedUser.clinic || {};
  const activeBranch = branchState || storedUser.branch || null;
  const isAdmin = user.role === "admin";
  const isBranchManager = user.role === "branch_manager";
  const clinicPlan = clinic.plan || "PRO";
  const isPaidTier = ["PRO", "ENTERPRISE"].includes(clinicPlan);
  const subscriptionExpired = isSubscriptionExpired(clinic);
  const subscriptionEnds = clinic.subscriptionEnds;
  const paidSubscriptionActive = hasActivePaidSubscription(clinic);
  const activeProAccess = hasActiveProAccess(clinic);
  const enterpriseAccess = hasEnterpriseAccess(clinic);
  const trialing = isTrialingClinic(clinic);
  const remainingTrialDays = getTrialDaysRemaining(clinic);
  let remainingPaidDays = 0;

  if (isPaidTier && subscriptionEnds && paidSubscriptionActive) {
    const end = new Date(subscriptionEnds);
    const now = new Date();
    const days = Math.max(
      0,
      Math.ceil((end - now) / (1000 * 60 * 60 * 24)),
    );
    remainingPaidDays = days;
  }

  useEffect(() => {
    if (
      !isPaidTier ||
      paidSubscriptionActive ||
      remainingTrialDays <= 0
    )
      return;

    let hideTimer;
    const showTimer = setTimeout(() => {
      setShowTrialBanner(true);

      if (remainingTrialDays > 3) {
        hideTimer = setTimeout(() => {
          setShowTrialBanner(false);
        }, 10000);
      }
    }, 2000);

    return () => {
      clearTimeout(showTimer);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [isPaidTier, remainingTrialDays, paidSubscriptionActive]);

  const canViewRecords =
    ["admin", "branch_manager", "doctor", "nurse"].includes(user.role) && activeProAccess;
  const showRestrictedAdminShell =
    subscriptionExpired && isAdmin;

  const applySummary = (summary = {}) => {
    setAppointmentCount(summary?.appointments?.scheduled || 0);
    setWaitingCount(summary?.waitingRoom?.active || 0);
    setPendingIntakesCount(summary?.intakes?.pending || 0);
  };

  useEffect(() => {
    if (!canViewRecords) return;

    const unsubscribe = subscribeDashboardSummary((summary) => {
      applySummary(summary || {});
    });

    const fetchCounts = async ({ forceRefresh = false } = {}) => {
      if (!canViewRecords) return;
      try {
        const summary = await getDashboardSummary({ forceRefresh });
        applySummary(summary);
      } catch {
        // ignore for badges
      }
    };

    fetchCounts();
    const intervalId = setInterval(fetchCounts, 30000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchCounts({ forceRefresh: true });
      }
    };

    window.addEventListener("focus", handleVisibilityChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      unsubscribe();
      clearInterval(intervalId);
      window.removeEventListener("focus", handleVisibilityChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [canViewRecords]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!branchMenuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (branchMenuRef.current?.contains(event.target)) return;
      setBranchMenuOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") setBranchMenuOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [branchMenuOpen]);

  useEffect(() => {
    let isMounted = true;

    const syncClinicState = async () => {
      try {
        const response = await api.get("/auth/clinic-profile");
        const latestClinic = response.data?.clinic || null;
        const latestBranches = response.data?.branches || getAvailableBranches();
        const latestActiveBranch = response.data?.activeBranch || null;

        if (!isMounted || !latestClinic) {
          return;
        }

        setClinicState(latestClinic);
        setAvailableBranches(latestBranches);
        setBranchState(latestActiveBranch);
        updateStoredUser({
          clinic: latestClinic,
          branches: latestBranches,
          branchId: latestActiveBranch?.id || null,
          branch: latestActiveBranch,
        });

        if (!isAdmin && isSubscriptionExpired(latestClinic)) {
          await logoutCurrentUser();
          navigate("/login", { replace: true });
          return;
        }

        if (isAdmin && isSubscriptionExpired(latestClinic)) {
          navigate("/upgrade", { replace: true });
        }
      } catch {
        // Let existing auth handling manage failures.
      }
    };

    syncClinicState();

    return () => {
      isMounted = false;
    };
  }, [isAdmin, navigate]);

  useEffect(() => {
    let isMounted = true;

    const loadBranches = async () => {
      try {
        const response = await api.get("/branches");
        if (!isMounted) return;
        const branches = (response.data?.branches || []).filter(
          (branch) => branch?.isActive,
        );
        setAvailableBranches(branches);

        const requestedBranchId = getActiveBranchId();
        const nextBranch =
          branches.find((branch) => branch.id === requestedBranchId) ||
          branches.find((branch) => branch.isPrimary) ||
          branches[0] ||
          null;

        if (nextBranch) {
          setBranchState(nextBranch);
          setActiveBranch(nextBranch);
          updateStoredUser({
            branches,
            branchId: nextBranch.id,
            branch: nextBranch,
          });
        }
      } catch {
        // ignore branch list failures and fall back to stored branch
      }
    };

    loadBranches();
    window.addEventListener(BRANCHES_UPDATED_EVENT, loadBranches);

    return () => {
      isMounted = false;
      window.removeEventListener(BRANCHES_UPDATED_EVENT, loadBranches);
    };
  }, []);

  const handleBranchChange = async (nextBranchId) => {
    if (!isAdmin) return;

    const nextBranch = availableBranches.find((branch) => branch.id === nextBranchId);
    if (!nextBranch) return;

    setBranchMenuOpen(false);
    setBranchState(nextBranch);
    setActiveBranch(nextBranch);
    updateStoredUser({
      branchId: nextBranch.id,
      branch: nextBranch,
      branches: availableBranches,
    });

    try {
      await getDashboardSummary({ forceRefresh: true });
    } catch {
      // page-level fetchers will retry
    }

    const destination = getBranchSwitchDestination(
      location.pathname,
      location.search,
    );
    window.location.assign(destination);
  };

  const handleLogout = async () => {
    await logoutCurrentUser();
    navigate("/login");
  };

  const handleNavClick = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const canDisplayActiveBranch = enterpriseAccess && activeBranch;
  const canSwitchBranches = canDisplayActiveBranch && isAdmin && availableBranches.length > 0;

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
  else if (location.pathname.includes("/audit-logs"))
    headerTitle = "Activity Logs";
  else if (location.pathname.includes("/branches"))
    headerTitle = "Manage Branches";
  else if (location.pathname.includes("/patients/"))
    headerTitle = "Patient Record";
  else if (location.pathname.includes("/upgrade")) headerTitle = "Upgrade Plan";
  else if (location.pathname.includes("/reports"))
    headerTitle = "Advanced Analytics";
  else if (location.pathname.includes("/pending-intakes"))
    headerTitle = "Pending Intakes";

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
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-surface-200 flex flex-col transition-transform duration-300 lg:translate-x-0 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:relative lg:flex"} print:hidden`}
      >
        <div className="flex items-center justify-between p-6 h-20 border-b border-surface-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl  p-1 ">
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
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest flex items-center gap-1 mt-0.5">
                {user.clinicName}
                {enterpriseAccess && <Crown size={12} className="text-amber-500 shrink-0" />}
              </span>
              {enterpriseAccess && activeBranch && (
                <span className="text-[10px] text-primary-600 font-semibold uppercase tracking-widest block mt-1">
                  {activeBranch.city || activeBranch.name}{activeBranch.area ? ` - ${activeBranch.area}` : ""}
                </span>
              )}
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
            {!showRestrictedAdminShell && (
              <NavItem
                icon={Home}
                label="Dashboard"
                path="/dashboard"
                location={location}
                onNavigate={handleNavClick}
              />
            )}
            {!showRestrictedAdminShell && canViewRecords && (
              <>
                <NavItem
                  icon={UserPlus}
                  label="Register Patient"
                  path="/register-patient"
                  location={location}
                  onNavigate={handleNavClick}
                />
                <NavItem
                  icon={Inbox}
                  label="Pending Intakes"
                  path="/pending-intakes"
                  badge={pendingIntakesCount}
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
                {(isAdmin || isBranchManager) && (
                  <NavItem
                    icon={BarChart3}
                    label="Reports"
                    path="/reports"
                    location={location}
                    onNavigate={handleNavClick}
                  />
                )}
              </>
            )}
          </div>

          {(isAdmin || isBranchManager) && !showRestrictedAdminShell && (
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
              {isAdmin && (
                <>
                  <NavItem
                    icon={Settings}
                    label="Clinic Settings"
                    path="/clinic-settings"
                    location={location}
                    onNavigate={handleNavClick}
                  />
                  <NavItem
                    icon={History}
                    label="Activity Logs"
                    path="/audit-logs"
                    location={location}
                    onNavigate={handleNavClick}
                  />
                  {enterpriseAccess && (
                    <NavItem
                      icon={Building2}
                      label="Manage Branches"
                      path="/branches"
                      location={location}
                      onNavigate={handleNavClick}
                    />
                  )}
                  <NavItem
                    icon={Trash2}
                    label="Trash"
                    path="/dashboard?tab=trash"
                    location={location}
                    onNavigate={handleNavClick}
                  />
                </>
              )}
            </div>
          )}

          {isAdmin && (
            <div>
              <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                {showRestrictedAdminShell ? "Renewal" : "Clinic Plan"}
              </p>
              <NavItem
                icon={Crown}
                label={showRestrictedAdminShell ? "Renew Subscription" : "Upgrade Plan"}
                path="/upgrade"
                location={location}
                onNavigate={handleNavClick}
              />
            </div>
          )}
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
              <p className="text-xs text-slate-500 capitalize">{user.displayRole === "nurse" && !storedUser.customRoleTitle ? "Nurse / Desk" : user.displayRole === "branch_manager" && !storedUser.customRoleTitle ? "Branch Manager" : user.displayRole}</p>
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

      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-surface-50/50 print:bg-white print:h-auto print:overflow-visible">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-surface-200 flex items-center justify-between px-6 z-10 shrink-0 shadow-sm print:hidden">
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
            {canDisplayActiveBranch && (
              <div ref={branchMenuRef} className="relative hidden md:block">
                {canSwitchBranches ? (
                  <button
                    type="button"
                    onClick={() => setBranchMenuOpen((open) => !open)}
                    className={`group flex min-w-[220px] max-w-[320px] items-center gap-3 rounded-2xl border bg-white px-3.5 py-2.5 text-left shadow-sm transition-all duration-200 ${
                      branchMenuOpen
                        ? "border-primary-300 ring-4 ring-primary-100"
                        : "border-surface-200 hover:border-primary-200 hover:shadow-md"
                    }`}
                    aria-haspopup="listbox"
                    aria-expanded={branchMenuOpen}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 transition-colors group-hover:bg-primary-100">
                      <Building2 size={17} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                        Active Branch
                      </span>
                      <span className="block truncate text-sm font-semibold text-slate-800">
                        {activeBranch?.city || activeBranch?.name || "Select branch"}{activeBranch?.area ? ` - ${activeBranch.area}` : ""}
                      </span>
                    </span>
                    <ChevronDown
                      size={16}
                      className={`shrink-0 text-slate-400 transition-transform duration-200 group-hover:text-primary-500 ${branchMenuOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                ) : (
                  <div className="flex min-w-[220px] max-w-[320px] cursor-default items-center gap-3 rounded-2xl border border-surface-200 bg-white px-3.5 py-2.5 text-left shadow-sm">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                      <Building2 size={17} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                        Active Branch
                      </span>
                      <span className="block truncate text-sm font-semibold text-slate-800">
                        {activeBranch?.city || activeBranch?.name || "Select branch"}{activeBranch?.area ? ` - ${activeBranch.area}` : ""}
                      </span>
                    </span>
                  </div>
                )}

                <AnimatePresence>
                  {canSwitchBranches && branchMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.16, ease: "easeOut" }}
                      className="absolute right-0 top-[calc(100%+0.65rem)] z-50 w-80 overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-2xl shadow-slate-200/70 ring-1 ring-slate-900/5"
                      role="listbox"
                    >
                      <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Switch Branch</p>
                        <p className="mt-1 text-sm font-medium text-slate-700">Choose where you are working from.</p>
                      </div>
                      <div className="max-h-72 overflow-y-auto p-2">
                        {availableBranches.map((branch) => {
                          const isSelected = branch.id === activeBranch?.id;
                          const branchLabel = `${branch.city || branch.name}${branch.area ? ` - ${branch.area}` : ""}`;

                          return (
                            <button
                              key={branch.id}
                              type="button"
                              onClick={() => handleBranchChange(branch.id)}
                              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors ${
                                isSelected
                                  ? "bg-primary-50 text-primary-800"
                                  : "text-slate-700 hover:bg-slate-50"
                              }`}
                              role="option"
                              aria-selected={isSelected}
                            >
                              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isSelected ? "bg-primary-100 text-primary-700" : "bg-slate-100 text-slate-500"}`}>
                                <Building2 size={16} />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-bold">{branchLabel}</span>
                                <span className="block truncate text-xs text-slate-500">{branch.name}</span>
                              </span>
                              {isSelected && <Check size={17} className="shrink-0 text-primary-600" />}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            <div className="flex items-center gap-2 pl-4 text-sm font-medium text-slate-600 bg-white border border-surface-200 px-4 py-2 rounded-full shadow-sm">
              <Clock size={16} className="text-primary-500 hidden sm:block" />
              {currentTime.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
              })}
            </div>
          </div>
        </header>

        <AnimatePresence>
          {showRestrictedAdminShell && (
            <MotionDiv
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="bg-gradient-to-r from-rose-600 to-red-600 text-white px-4 py-3 text-center text-sm font-bold shadow-sm shrink-0 relative z-10 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 print:hidden"
            >
              <span className="flex items-center gap-2">
                <Crown size={18} />
                Your paid plan access has expired. Billing is available, but clinic operations are now locked until renewal.
              </span>
              {location.pathname !== "/upgrade" && (
                <button
                  onClick={() => navigate("/upgrade")}
                  className="bg-white/20 hover:bg-white/30 px-4 py-1.5 rounded-full text-xs transition-colors border border-white/30 backdrop-blur-sm shadow-sm"
                >
                  Renew Now
                </button>
              )}
            </MotionDiv>
          )}
          {trialing &&
            remainingTrialDays > 0 &&
            !showRestrictedAdminShell &&
            showTrialBanner && (
              <MotionDiv
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                className={`text-white px-4 py-2.5 text-center text-sm font-bold shadow-sm shrink-0 relative z-10 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 overflow-hidden print:hidden ${
                  remainingTrialDays <= 3
                    ? "bg-gradient-to-r from-red-600 to-rose-600"
                    : "bg-gradient-to-r from-amber-500 to-orange-500"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Crown size={18} />
                  {remainingTrialDays <= 3 ? "URGENT: " : ""}You have{" "}
                  {remainingTrialDays} days left on your 14-day {clinicPlan === "ENTERPRISE" ? "Enterprise" : "Pro"} Trial.
                </span>
                <div className="flex items-center gap-2">
                  {location.pathname !== "/upgrade" && (
                    <button
                      onClick={() => navigate("/upgrade")}
                      className="bg-white/20 hover:bg-white/30 px-4 py-1.5 rounded-full text-xs transition-colors border border-white/30 backdrop-blur-sm shadow-sm focus:outline-none"
                    >
                      Upgrade Now
                    </button>
                  )}
                  {remainingTrialDays > 3 && (
                    <button
                      onClick={() => {
                        setShowTrialBanner(false);
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

        {isPaidTier &&
          paidSubscriptionActive &&
          subscriptionEnds &&
          !showRestrictedAdminShell &&
          remainingPaidDays <= 7 && (
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2.5 text-center text-sm font-bold shadow-sm shrink-0 relative z-10 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 print:hidden">
              <span className="flex items-center gap-2">
                <Crown size={18} /> {clinicPlan === "ENTERPRISE" ? "Enterprise" : "Pro"} Plan renews in {remainingPaidDays} {remainingPaidDays === 1 ? "day" : "days"} (
                {new Date(subscriptionEnds).toLocaleDateString("en-NG", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}).
              </span>
              {location.pathname !== "/upgrade" && (
                <button
                  onClick={() => navigate("/upgrade")}
                  className="bg-white/20 hover:bg-white/30 px-4 py-1.5 rounded-full text-xs transition-colors border border-white/30 backdrop-blur-sm shadow-sm"
                >
                  Manage Billing
                </button>
              )}
            </div>
          )}

        <div className="flex-1 overflow-y-auto w-full relative print:overflow-visible">
          <Outlet />
        </div>
      </main>
    </div>
  );
}






