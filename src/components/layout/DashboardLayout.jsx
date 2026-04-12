import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Calendar, Clock, CreditCard, UserPlus, 
  LogOut, Trash2, Home, HeartPulse, Menu, X, Settings
} from "lucide-react";
import { logoutCurrentUser } from "../../services/api";
import Button from "../ui/Button";

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const storedUser = JSON.parse((localStorage.getItem("user") || sessionStorage.getItem("user"))) || {};
  const user = {
    name: storedUser.name || storedUser.email || "User",
    role: storedUser.role || "nurse",
    clinicName: storedUser.clinic?.name || "Clinic",
  };
  
  const canViewRecords = ["admin", "doctor", "nurse"].includes(user.role);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    await logoutCurrentUser();
    navigate("/login");
  };

  const NavItem = ({ icon: Icon, label, path, danger }) => {
    const active = location.pathname === path.split('?')[0] && (path.includes('tab=trash') ? location.search.includes('tab=trash') : !location.search.includes('tab=trash'));
    
    return (
      <button
        onClick={() => { navigate(path); setMobileMenuOpen(false); }}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 mt-1 font-medium ${
          active && !danger
            ? "bg-primary-50 text-primary-700 shadow-sm" 
            : danger 
              ? "text-red-600 hover:bg-red-50 hover:text-red-700" 
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`}
      >
        <Icon size={20} className={active && !danger ? "text-primary-600" : ""} />
        {label}
      </button>
    );
  };

  // Determine header title based on pathname
  let headerTitle = "Overview";
  if (location.pathname.includes("/register-patient")) headerTitle = "Register Patient";
  else if (location.pathname.includes("/appointments")) headerTitle = "Appointments";
  else if (location.pathname.includes("/waiting-room")) headerTitle = "Waiting Room";
  else if (location.pathname.includes("/billing")) headerTitle = "Billing";
  else if (location.pathname.includes("/signup")) headerTitle = "Manage Staff";
  else if (location.pathname.includes("/clinic-settings")) headerTitle = "Clinic Settings";
  else if (location.pathname.includes("/patients/")) headerTitle = "Patient Record";
  
  if (location.search.includes("tab=trash")) headerTitle = "Trash Management";

  return (
    <div className="flex h-screen bg-surface-50 font-sans overflow-hidden">
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside 
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-surface-200 flex flex-col transition-transform duration-300 lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:relative lg:flex'}`}
      >
        <div className="flex items-center justify-between p-6 h-20 border-b border-surface-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-primary-600 p-2 rounded-xl shadow-inner shadow-primary-800/30">
              <HeartPulse className="text-white h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 tracking-tight block leading-4">PrimuxCare</span>
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">{user.clinicName}</span>
            </div>
          </div>
          <button className="lg:hidden text-slate-500" onClick={() => setMobileMenuOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Main Menu</p>
            <NavItem icon={Home} label="Dashboard" path="/dashboard" />
            {canViewRecords && (
              <>
                <NavItem icon={UserPlus} label="Register Patient" path="/register-patient" />
                <NavItem icon={Calendar} label="Appointments" path="/appointments" />
                <NavItem icon={Clock} label="Waiting Room" path="/waiting-room" />
                <NavItem icon={CreditCard} label="Billing" path="/billing" />
              </>
            )}
          </div>
          
          {user.role === "admin" && (
            <div>
              <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Administration</p>
              <NavItem icon={Users} label="Manage Staff" path="/signup" />
              <NavItem icon={Settings} label="Clinic Settings" path="/clinic-settings" />
              <NavItem icon={Trash2} label="Trash" path="/dashboard?tab=trash" />
            </div>
          )}
        </div>

        <div className="p-4 border-t border-surface-100 bg-surface-50 shrink-0">
          <div className="flex items-center gap-3 px-4 py-2 mb-2">
            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold border border-primary-200">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 truncate">
              <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
              <p className="text-xs text-slate-500 capitalize">{user.role}</p>
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start pl-4 text-slate-600 hover:text-red-600 hover:bg-red-50" onClick={handleLogout}>
            <LogOut size={18} className="mr-3" /> Sign Out
          </Button>
        </div>
      </motion.aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-surface-50/50">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-surface-200 flex items-center justify-between px-6 z-10 shrink-0 shadow-sm">
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-lg bg-white border border-surface-200 text-slate-600 lg:hidden hover:bg-surface-50" onClick={() => setMobileMenuOpen(true)}>
              <Menu size={20} />
            </button>
            <h1 className="text-xl font-semibold text-slate-800">
              {headerTitle}
            </h1>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium text-slate-600 bg-white border border-surface-200 px-4 py-2 rounded-full shadow-sm">
             <Clock size={16} className="text-primary-500 hidden sm:block" />
             {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto w-full relative">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
