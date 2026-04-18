import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Settings, Building, Mail, Phone, MapPin, User, DollarSign, AlertTriangle, Save, Power, ArrowLeft, Image as ImageIcon, Palette, Lock, Link as LinkIcon, Copy, CheckCircle, Crown } from "lucide-react";
import api, { logoutCurrentUser } from "../services/api";
import { DEFAULT_PROCEDURE_PRESETS, formatNaira, normalizeProcedurePresets } from "../constants/billing";
import { Card, CardContent } from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ui/ConfirmModal";
import usePersistentState from "../hooks/usePersistentState";
import { readStoredJson } from "../utils/persistence";
import { resolveAssetUrl } from "../utils/assetUrl";

const initialForm = {
  clinicName: "", clinicEmail: "", clinicPhone: "", clinicCity: "", clinicAddress: "", contactPerson: "",
  logoUrl: "", brandColor: "#0f172a",
  procedurePresetPrices: DEFAULT_PROCEDURE_PRESETS,
};



export default function ClinicSettings() {
  const navigate = useNavigate();
  const clinicSettingsDraftKey = "primuxcare:draft:clinic-settings";
  const hasSavedClinicDraft = Boolean(readStoredJson(clinicSettingsDraftKey, null));
  const [form, setForm, clearFormDraft] = usePersistentState(
    clinicSettingsDraftKey,
    initialForm,
  );
  const [billingInfo, setBillingInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [confirmConfig, setConfirmConfig] = useState(null);
  
  const storedUser = JSON.parse((localStorage.getItem("user") || sessionStorage.getItem("user")) || "null");
  const currentClinic = billingInfo || storedUser?.clinic || null;
  const isPro = currentClinic?.plan === "PRO" || currentClinic?.plan === "ENTERPRISE_AI";
  const intakeUrl = `${window.location.origin}/intake/${storedUser?.clinic?.id}`;

  const syncStoredClinic = (clinicPatch) => {
    [localStorage, sessionStorage].forEach((storage) => {
      const rawUser = storage.getItem("user");
      if (!rawUser) {
        return;
      }

      try {
        const parsedUser = JSON.parse(rawUser);
        storage.setItem(
          "user",
          JSON.stringify({
            ...parsedUser,
            clinic: {
              ...(parsedUser.clinic || {}),
              ...clinicPatch,
            },
          }),
        );
      } catch {
        // ignore broken persisted state
      }
    });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(intakeUrl);
    setCopied(true);
    setToast({ show: true, message: "Intake link copied to clipboard", type: "success" });
    setTimeout(() => setCopied(false), 3000);
  };

  useEffect(() => {
    const storedUser = JSON.parse((localStorage.getItem("user") || sessionStorage.getItem("user")) || "null");
    if (!storedUser || storedUser.role !== "admin") return navigate("/login", { replace: true });

    const fetchClinicProfile = async () => {
      try {
        setLoading(true);
        const [profileResponse, billingResponse] = await Promise.all([
          api.get("/auth/clinic-profile"),
          api.get("/billing"),
        ]);
        const clinic = profileResponse.data?.clinic;
        setBillingInfo(billingResponse.data?.clinic || null);
        if (!hasSavedClinicDraft) {
          setForm({
            clinicName: clinic?.name || "", clinicEmail: clinic?.email || "", clinicPhone: clinic?.phone || "",
            clinicCity: clinic?.city || "", clinicAddress: clinic?.address || "", contactPerson: clinic?.contactPerson || "",
            logoUrl: clinic?.logoUrl || "", brandColor: clinic?.brandColor || "#0f172a",
            procedurePresetPrices: normalizeProcedurePresets(clinic?.procedurePresetPrices),
          });
        }
      } catch (err) { setToast({ show: true, message: err.response?.data?.message || "Failed to load profile", type: "error" }); } 
      finally { setLoading(false); }
    };
    fetchClinicProfile();
  }, [hasSavedClinicDraft, navigate, setForm]);

  const handleChange = (e) => setForm(c => ({ ...c, [e.target.name]: e.target.value }));
  const handleProcedurePriceChange = (index, value) => {
    setForm(c => ({
      ...c, procedurePresetPrices: c.procedurePresetPrices.map((preset, i) => i === index ? { ...preset, unitPrice: value === "" ? "" : Number(value) } : preset)
    }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploadingLogo(true);
      const formData = new FormData();
      formData.append("file", file);
      const response = await api.post("/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setForm((c) => ({ ...c, logoUrl: response.data.url }));
      setToast({ show: true, message: "Logo uploaded successfully", type: "success" });
    } catch (err) {
      setToast({ show: true, message: err.response?.data?.message || "Logo upload failed", type: "error" });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await api.put("/auth/clinic-profile", form);
      const clinic = response.data?.clinic;
      syncStoredClinic(clinic);
      clearFormDraft();
      setForm({
        clinicName: clinic?.name || "", clinicEmail: clinic?.email || "", clinicPhone: clinic?.phone || "",
        clinicCity: clinic?.city || "", clinicAddress: clinic?.address || "", contactPerson: clinic?.contactPerson || "",
        logoUrl: clinic?.logoUrl || "", brandColor: clinic?.brandColor || "#0f172a",
        procedurePresetPrices: normalizeProcedurePresets(clinic?.procedurePresetPrices),
      });
      setBillingInfo((current) => ({ ...(current || {}), ...clinic }));
      setToast({ show: true, message: response.data?.message || "Profile updated successfully", type: "success" });
    } catch (err) { setToast({ show: true, message: err.response?.data?.message || "Failed to update profile", type: "error" }); } 
    finally { setSaving(false); }
  };

  const executeDeactivateClinic = async () => {
    try {
      setDeactivating(true);
      await api.patch("/auth/clinic-profile/deactivate");
      await logoutCurrentUser();
      navigate("/login", { replace: true });
    } catch (err) { setToast({ show: true, message: err.response?.data?.message || "Failed to deactivate clinic", type: "error" }); } 
    finally { setDeactivating(false); }
  };

  const handleDeactivateClinic = () => {
    setConfirmConfig({
      title: "Deactivate Clinic",
      message: "Deactivate this clinic account? All staff logins will be blocked until support reactivates the clinic.",
      confirmText: "Yes, Deactivate",
      danger: true,
      onConfirm: executeDeactivateClinic
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-surface-200">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">Clinic Settings</h2>
          <p className="text-sm text-slate-500 max-w-xl">Manage your clinic profile, contact details, and billing parameters.</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/signup")} className="w-full md:w-auto border-slate-200 bg-white">
          <ArrowLeft size={16} className="mr-2" /> Manage Staff
        </Button>
      </div>

      {loading ? (
        <div className="py-20 text-center flex flex-col items-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent mb-4" /><p className="text-slate-500 font-medium">Loading settings...</p></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6 items-start">
          <div className="space-y-6">
             <Card className="border border-surface-200 shadow-sm relative overflow-hidden">
                <div className="bg-slate-900 absolute top-0 left-0 w-full h-24 z-0"></div>
                <CardContent className="p-8 pt-12 relative z-10">
                   <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 inline-flex mb-6 text-primary-600"><Settings size={32} /></div>
                   <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                         <Input label="Clinic Name *" name="clinicName" value={form.clinicName} onChange={handleChange} required icon={Building} className="bg-white" />
                         <Input label="Clinic Email *" name="clinicEmail" type="email" value={form.clinicEmail} onChange={handleChange} required icon={Mail} className="bg-white" />
                         <Input label="Clinic Phone" name="clinicPhone" value={form.clinicPhone} onChange={handleChange} icon={Phone} className="bg-white" />
                         <Input label="City" name="clinicCity" value={form.clinicCity} onChange={handleChange} icon={MapPin} className="bg-white" />
                         <Input label="Contact Person" name="contactPerson" value={form.contactPerson} onChange={handleChange} icon={User} className="bg-white" />
                         
                         <div className="space-y-1.5 md:col-span-2">
                           <label className="text-sm font-semibold text-slate-700">Clinic Address</label>
                           <textarea name="clinicAddress" value={form.clinicAddress} onChange={handleChange} className="w-full rounded-xl border border-slate-200 p-3 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm resize-none" rows="3" />
                         </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100">
                         <Button type="submit" isLoading={saving} className="shadow-md py-6 px-8"><Save size={18} className="mr-2" /> Save Profile</Button>
                      </div>
                   </form>
                </CardContent>
             </Card>

             {/* Custom Branding Box (Pro) */}
             <Card className="border border-surface-200 shadow-sm relative overflow-hidden mb-6">
                <CardContent className="p-8">
                   <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg flex items-center mb-1"><Palette size={20} className="mr-2 text-primary-600" /> Custom Branding</h3>
                        <p className="text-slate-500 text-sm">Add your logo and distinct color to Invoices.</p>
                      </div>
                      {!isPro && (
                        <div className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center border border-amber-200">
                          <Lock size={14} className="mr-1.5" /> PRO Feature
                        </div>
                      )}
                   </div>

                   <div className={`space-y-6 ${!isPro ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Clinic Logo</label>
                        <div className="flex items-center gap-4">
                          {form.logoUrl ? (
                             <img src={resolveAssetUrl(form.logoUrl)} alt="Logo" className="h-16 w-16 object-contain rounded border border-slate-200 p-1 bg-white" />
                          ) : (
                             <div className="h-16 w-16 bg-slate-100 rounded border border-slate-200 flex items-center justify-center text-slate-400"><ImageIcon size={24} /></div>
                          )}
                          <div>
                            <input type="file" id="logo-upload" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={!isPro || uploadingLogo} />
                            <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('logo-upload').click()} isLoading={uploadingLogo} className="bg-white border-slate-300">
                               Upload New Logo
                            </Button>
                            <p className="text-xs text-slate-400 mt-1">Recommended: PNG/JPG under 10MB.</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Brand Accent Color</label>
                        <div className="flex items-center gap-3">
                           <input type="color" name="brandColor" value={form.brandColor} onChange={handleChange} disabled={!isPro} className="h-10 w-16 rounded border border-slate-200 cursor-pointer p-0.5" />
                           <Input name="brandColor" value={form.brandColor} onChange={handleChange} disabled={!isPro} placeholder="#HEX" className="bg-white" />
                        </div>
                      </div>
                   </div>
                   {!isPro && (
                     <div className="absolute inset-0 bg-white/40 flex items-center justify-center z-10 backdrop-blur-[1px]">
                        <Button onClick={() => navigate('/upgrade')} className="shadow-lg">Upgrade to Unlock</Button>
                     </div>
                   )}
                </CardContent>
             </Card>

             {/* Patient Intake URL (Pro) */}
             <Card className="border border-surface-200 shadow-sm relative overflow-hidden mb-6">
                 <CardContent className="p-8">
                    <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4">
                       <div>
                         <h3 className="font-bold text-slate-900 text-lg flex items-center mb-1"><LinkIcon size={20} className="mr-2 text-primary-600" /> Patient Intake Form</h3>
                         <p className="text-slate-500 text-sm">Share this link to let patients securely self-register online.</p>
                       </div>
                       {!isPro && (
                         <div className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center border border-amber-200">
                           <Lock size={14} className="mr-1.5" /> PRO Feature
                         </div>
                       )}
                    </div>
                    
                    <div className={`mt-4 ${!isPro ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                       <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-600 font-mono truncate select-all">
                             {intakeUrl}
                          </div>
                          <Button variant="outline" onClick={handleCopyLink} className="shrink-0 bg-white shadow-sm border-slate-300">
                             {copied ? <CheckCircle size={18} className="text-emerald-500" /> : <Copy size={18} />}
                          </Button>
                       </div>
                       <p className="text-xs text-slate-400 mt-3">Link connects directly to your secure patient directory.</p>
                    </div>

                    {!isPro && (
                      <div className="absolute inset-0 bg-white/40 flex items-center justify-center z-10 backdrop-blur-[1px]">
                         <Button onClick={() => navigate('/upgrade')} className="shadow-lg">Upgrade to Unlock</Button>
                      </div>
                    )}
                 </CardContent>
             </Card>

             <Card className="border border-red-200 shadow-sm bg-gradient-to-br from-red-50 to-orange-50">
                <CardContent className="p-8">
                   <h3 className="font-bold text-red-900 text-lg flex items-center mb-2"><AlertTriangle size={20} className="mr-2" /> Danger Zone</h3>
                   <p className="text-red-800 text-sm max-w-2xl mb-6">If your clinic no longer uses this software, you can deactivate the account. This will immediately log you out and block all staff access. Deactivated clinics can only be restored through primuxcare support.</p>
                   <Button variant="ghost" onClick={handleDeactivateClinic} disabled={deactivating} className="bg-white/50 border border-red-200 text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm">
                     <Power size={18} className="mr-2" /> {deactivating ? "Deactivating..." : "Deactivate Clinic"}
                   </Button>
                </CardContent>
             </Card>
          </div>

          <div className="space-y-6">


            <Card className="border border-emerald-200 bg-emerald-50 shadow-sm">
               <CardContent className="p-6">
                  <div className="mb-6 border-b border-emerald-200/60 pb-6">
                     <h3 className="font-bold text-emerald-900 text-lg flex items-center mb-2"><DollarSign size={20} className="mr-2 text-emerald-600" /> Billing Standards</h3>
                     <p className="text-sm text-emerald-800">Set the default Nigerian Naira (NGN) parameters used during quick-add invoice generation across the platform.</p>
                  </div>

                  <div className="space-y-3">
                     {form.procedurePresetPrices.map((preset, index) => (
                       <div key={preset.description} className="bg-white rounded-xl border border-emerald-100 p-4 shadow-sm flex flex-col gap-3 group hover:border-emerald-300 transition-colors">
                          <div className="flex items-start justify-between">
                             <div>
                                <p className="font-bold text-slate-900 text-sm leading-tight">{preset.description}</p>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mt-1">{preset.category}</p>
                             </div>
                             <div className="text-right">
                                <span className="text-xs font-semibold text-slate-400">Price (NGN)</span>
                                <input type="number" min="0" step="0.01" value={preset.unitPrice} onChange={(e) => handleProcedurePriceChange(index, e.target.value)} className="w-full text-right font-mono font-bold text-slate-900 border-0 focus:ring-0 p-0 text-base bg-transparent mt-1 group-hover:text-emerald-700 transition-colors" />
                             </div>
                          </div>
                          <div className="border-t border-emerald-50 pt-2 text-right">
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-100/50 px-2 py-1 rounded">{formatNaira(preset.unitPrice)}</span>
                          </div>
                       </div>
                     ))}
                  </div>
               </CardContent>
            </Card>
          </div>
        </div>
      )}
      {toast.show && <Toast message={toast.message} type={toast.type} duration={3000} onClose={() => setToast({ ...toast, show: false })} />}
      <ConfirmModal 
        isOpen={!!confirmConfig} 
        onClose={() => setConfirmConfig(null)} 
        {...confirmConfig} 
      />
    </motion.div>
  );
}
