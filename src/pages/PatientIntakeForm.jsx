import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, AlertCircle, Building, HeartPulse } from "lucide-react";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import api from "../services/api";

export default function PatientIntakeForm() {
  const { clinicId } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [clinic, setClinic] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "other",
    phone: "",
    email: "",
    address: ""
  });

  useEffect(() => {
    const fetchClinic = async () => {
      try {
        const res = await api.get(`/intake/${clinicId}`);
        setClinic(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Clinic intake form unavailable.");
      } finally {
        setLoading(false);
      }
    };
    fetchClinic();
  }, [clinicId]);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.post(`/intake/${clinicId}`, form);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || "Internal error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
     return (
       <div className="min-h-screen bg-slate-50 flex items-center justify-center">
         <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-slate-800"></div>
       </div>
     );
  }

  if (error && !clinic) {
     return (
       <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-md w-full">
             <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
             <h2 className="text-xl font-bold text-slate-900 mb-2">Form Unavailable</h2>
             <p className="text-slate-500">{error}</p>
          </div>
       </div>
     );
  }

  if (success) {
     return (
       <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center relative" style={{ backgroundColor: clinic.brandColor ? `${clinic.brandColor}10` : '#f8fafc' }}>
         <div className="bg-white p-10 rounded-3xl shadow-xl max-w-md w-full relative z-10 border border-white">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
               <CheckCircle size={40} />
            </motion.div>
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">You're all set!</h2>
            <p className="text-slate-600 mb-6">Your registration details have been securely sent to <strong>{clinic?.name}</strong>.</p>
            <p className="text-sm font-medium text-slate-400">You may now close this window.</p>
         </div>
       </div>
     );
  }

  // Branding Customizations
  const brandStyle = clinic?.brandColor ? { color: clinic.brandColor } : {};
  const buttonStyle = clinic?.brandColor ? { backgroundColor: clinic.brandColor } : {};

  return (
    <div className="min-h-screen flex flex-col py-12 px-4 sm:px-6 lg:px-8 relative" style={{ backgroundColor: clinic?.brandColor ? `${clinic.brandColor}0D` : '#f8fafc' }}>
      
      {/* HEADER LOGO */}
      <div className="flex flex-col items-center justify-center mb-10 w-full max-w-2xl mx-auto">
         {clinic?.logoUrl ? (
            <img src={clinic.logoUrl} alt={clinic.name} className="h-20 w-20 object-contain mb-4 rounded-xl shadow-sm bg-white p-1 border border-white" />
         ) : (
            <div className="h-16 w-16 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center mb-4" style={brandStyle}>
               <HeartPulse size={32} />
            </div>
         )}
         <h1 className="text-2xl font-black text-slate-900 text-center tracking-tight leading-tight">{clinic?.name}</h1>
         <p className="mt-2 text-sm text-slate-500 uppercase tracking-widest font-semibold flex items-center"><Building size={14} className="mr-1" /> New Patient Intake</p>
      </div>

      {/* FORM */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl mx-auto bg-white rounded-[2rem] shadow-xl p-8 sm:p-10 border border-slate-100">
         <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-900">Personal Information</h2>
            <p className="text-slate-500 text-sm mt-1">Please fill out your details to speed up your visit.</p>
         </div>

         {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm font-medium flex items-start gap-3">
               <AlertCircle size={18} className="shrink-0 mt-0.5" /> {error}
            </div>
         )}

         <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="md:col-span-2">
                 <Input label="Full Name *" name="name" value={form.name} onChange={handleChange} required placeholder="e.g. Jane Doe" className="bg-slate-50 h-12" />
               </div>
               
               <Input label="Age *" name="age" type="number" value={form.age} onChange={handleChange} required placeholder="Years" className="bg-slate-50 h-12" />
               
               <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 block">Gender *</label>
                  <select name="gender" value={form.gender} onChange={handleChange} required className="w-full h-12 rounded-xl border border-slate-200 px-3 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
               </div>
               
               <Input label="Mobile Phone *" name="phone" value={form.phone} onChange={handleChange} required placeholder="e.g. +234..." className="bg-slate-50 h-12" />
               <Input label="Email Address" name="email" type="email" value={form.email} onChange={handleChange} placeholder="Optional" className="bg-slate-50 h-12" />
               
               <div className="md:col-span-2 space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 block">Home Address</label>
                  <textarea name="address" value={form.address} onChange={handleChange} rows="3" placeholder="Residential address" className="w-full rounded-xl border border-slate-200 p-3 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"></textarea>
               </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
               <p className="text-xs text-slate-400 mb-4">* Your information is kept strictly confidential and secure.</p>
               <Button type="submit" isLoading={submitting} className="w-full h-14 text-lg font-bold shadow-lg rounded-xl text-white" style={buttonStyle}>
                  Submit Registration
               </Button>
            </div>
         </form>
      </motion.div>
    </div>
  );
}
