import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, X, Zap, Crown, Sparkles, MessageSquare, Briefcase, FileUp, BookOpen } from "lucide-react";
import api from "../services/api";
import Toast from "../components/Toast";
import Button from "../components/ui/Button";

export default function UpgradePlan() {
  const [patientCount, setPatientCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const storedUser = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user")) || {};
  const currentPlan = storedUser?.clinic?.plan || "FREE";

  useEffect(() => {
    const loadUsage = async () => {
      try {
        setLoading(true);
        const res = await api.get("/patients");
        const activePatients = (res.data || []).filter((p) => !p.isDeleted);
        setPatientCount(activePatients.length);
      } catch (err) {
        console.error("Failed to load patient count", err);
      } finally {
        setLoading(false);
      }
    };
    loadUsage();
  }, []);

  const handleUpgradeClick = () => {
    setToast({ message: "Stripe Billing Integration is coming in the next phase! 🚀", type: "success" });
  };

  const usagePercent = Math.min((patientCount / 100) * 100, 100);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-6xl mx-auto p-6 md:p-8 min-h-full">
      {toast && <Toast message={toast.message} type={toast.type} duration={4000} onClose={() => setToast(null)} />}

      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
          Upgrade your Clinic's Potential
        </h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          Scale your practice with unlimited patients, automated reminders, and advanced analytics designed to grow your revenue.
        </p>
      </div>

      {currentPlan === "FREE" && (
        <div className="mb-12 max-w-3xl mx-auto bg-white p-6 rounded-2xl shadow-sm border border-surface-200">
          <div className="flex justify-between items-end mb-2">
            <div>
               <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Free Plan Usage</h3>
               <p className="text-2xl font-bold text-slate-800">{patientCount} <span className="text-lg font-medium text-slate-400">/ 100 Patients</span></p>
            </div>
            {patientCount >= 100 ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 font-bold text-sm rounded-full">
                <X size={16} /> Limit Reached
              </span>
            ) : (
              <span className="text-sm font-medium text-primary-600 border border-primary-200 bg-primary-50 px-3 py-1 rounded-full">
                {100 - patientCount} slots remaining
              </span>
            )}
          </div>
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden mt-4">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ${patientCount >= 100 ? 'bg-red-500' : 'bg-primary-500'}`}
              style={{ width: `${loading ? 0 : usagePercent}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {/* Free Plan */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col hover:shadow-md transition-shadow relative">
           {currentPlan === "FREE" && (
             <div className="absolute top-0 right-8 transform -translate-y-1/2">
                <span className="bg-slate-800 text-white text-xs font-bold uppercase tracking-widest py-1 px-3 rounded-full shadow-sm">Current Plan</span>
             </div>
           )}
           <div className="mb-6">
             <h3 className="text-2xl font-bold text-slate-900 mb-2">Starter</h3>
             <p className="text-slate-500 text-sm">Perfect for solo practitioners just starting out.</p>
           </div>
           
           <div className="mb-8">
             <span className="text-5xl font-extrabold text-slate-900">Free</span>
             <span className="text-slate-500 font-medium"> / forever</span>
           </div>

           <Button variant="outline" className="w-full mb-8 py-6 text-lg border-slate-300 font-semibold" disabled>
             {currentPlan === "FREE" ? "Active" : "Downgrade"}
           </Button>

           <div className="space-y-4 flex-1">
             <FeatureItem included>Up to 100 Patients</FeatureItem>
             <FeatureItem included>2 Staff Accounts</FeatureItem>
             <FeatureItem included>Manual Appointments</FeatureItem>
             <FeatureItem included>Basic Clinical Records</FeatureItem>
             <FeatureItem missing>Automated SMS Reminders</FeatureItem>
             <FeatureItem missing>Unlimited Storage (X-Ray Uploads)</FeatureItem>
             <FeatureItem missing>Advanced Analytics</FeatureItem>
           </div>
        </div>

        {/* Pro Plan */}
        <div className="bg-gradient-to-b from-slate-900 to-slate-800 rounded-3xl p-8 border border-slate-700 shadow-xl flex flex-col relative transform md:-translate-y-4">
           {currentPlan === "PRO" && (
             <div className="absolute top-0 right-8 transform -translate-y-1/2">
                <span className="bg-primary-500 text-white text-xs font-bold uppercase tracking-widest py-1 px-3 rounded-full shadow-sm">Current Plan</span>
             </div>
           )}
           <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-bold uppercase tracking-widest py-1.5 px-4 rounded-full shadow-lg flex items-center gap-1.5">
                 <Crown size={16} /> Recommended
              </span>
           </div>

           <div className="mb-6 mt-4">
             <h3 className="text-2xl font-bold text-white mb-2">Professional</h3>
             <p className="text-slate-400 text-sm">For growing clinics that need scale and automation.</p>
           </div>
           
           <div className="mb-8 flex items-end gap-1">
             <span className="text-4xl md:text-5xl font-extrabold text-white">NGN 12,000</span>
             <span className="text-slate-400 font-medium mb-1"> / month</span>
           </div>

           <Button 
             className="w-full py-6 text-lg font-bold bg-primary-500 hover:bg-primary-400 text-white shadow-[0_0_20px_rgba(14,165,233,0.3)] border-transparent" 
             onClick={handleUpgradeClick}
           >
             {currentPlan === "PRO" ? "Manage Billing" : "Start 14-Day Free Trial"}
           </Button>
           
           <div className="h-8 flex justify-center items-center mb-4">
             {currentPlan !== "PRO" && (
                <p className="text-slate-400 text-xs font-medium bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700">No credit card required initially.</p>
             )}
           </div>

           <div className="space-y-4 flex-1">
             <FeatureItem included dark highlight>Unlimited Patients</FeatureItem>
             <FeatureItem included dark highlight>Unlimited Staff Accounts</FeatureItem>
             <FeatureItem included dark highlight icon={<MessageSquare size={18} />}>Automated SMS & Email Reminders</FeatureItem>
             <FeatureItem included dark highlight icon={<FileUp size={18} />}>Unlimited X-Ray & File Uploads</FeatureItem>
             <FeatureItem included dark highlight icon={<BookOpen size={18} />}>1-Click Dental Formulary</FeatureItem>
             <FeatureItem included dark highlight>Online Patient Intake Forms</FeatureItem>
             <FeatureItem included dark>Everything in Starter</FeatureItem>
             <FeatureItem included dark>Custom Invoice Branding</FeatureItem>
             <FeatureItem included dark>Advanced Role-Based Access (RBAC)</FeatureItem>
             <FeatureItem included dark>Priority 24/7 Support</FeatureItem>
           </div>
        </div>
      </div>
    </motion.div>
  );
}

function FeatureItem({ children, included, missing, dark, highlight, icon }) {
  return (
    <div className={`flex items-center gap-3 ${missing ? 'opacity-50' : ''}`}>
      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
        included 
          ? highlight 
             ? 'bg-amber-500/20 text-amber-400'
             : dark ? 'bg-primary-500/20 text-primary-400' : 'bg-emerald-100 text-emerald-600' 
          : 'bg-slate-100 text-slate-400'
      }`}>
        {included ? (icon || <Check size={14} strokeWidth={3} />) : <X size={14} strokeWidth={3} />}
      </div>
      <span className={`text-sm font-medium ${
        dark ? 'text-slate-200' : 'text-slate-700'
      } ${highlight ? 'font-bold text-white' : ''}`}>
        {children}
      </span>
    </div>
  );
}
