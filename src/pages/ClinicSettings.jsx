import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Settings, Building, Mail, Phone, MapPin, User, DollarSign, AlertTriangle, Save, Power, ArrowLeft, Image as ImageIcon, Palette, Lock, Link as LinkIcon, Copy, CheckCircle, Crown, Upload, Trash2, Plus, Edit2, Globe, Clock } from "lucide-react";
import api, { logoutCurrentUser } from "../services/api";
import { DEFAULT_PROCEDURE_PRESETS, formatNaira, normalizeProcedurePresets } from "../constants/billing";
import { Card, CardContent } from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ui/ConfirmModal";
import usePersistentState from "../hooks/usePersistentState";
import { readStoredJson } from "../utils/persistence";
import { resolveAssetUrl } from "../utils/assetUrl";
import { COUNTRIES } from "../constants/countries";
import { REMINDER_TIMEZONES } from "../constants/reminderTimezones";
import { hasActiveProAccess } from "../utils/clinicAccess";

const initialForm = {
  clinicName: "", clinicEmail: "", clinicPhone: "", clinicCountry: "", clinicCity: "", clinicAddress: "", contactPerson: "",
  logoUrl: "", brandColor: "#0f172a",
  reminderTimezone: "Africa/Lagos", reminderWindowStartHour: "8", reminderWindowEndHour: "18",
  procedurePresetPrices: DEFAULT_PROCEDURE_PRESETS,
};

const PRESET_DESCRIPTIONS = Array.from(new Set(DEFAULT_PROCEDURE_PRESETS.map(p => p.description)));
const PRESET_CATEGORIES = Array.from(new Set(DEFAULT_PROCEDURE_PRESETS.map(p => p.category)));



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
  const [intakeUpdating, setIntakeUpdating] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [confirmConfig, setConfirmConfig] = useState(null);
  const [editingPresets, setEditingPresets] = useState({});
  const [presetOriginals, setPresetOriginals] = useState({});
  const [customInputs, setCustomInputs] = useState({});

  const [deactivateStep, setDeactivateStep] = useState(0);
  const [deactivatePassword, setDeactivatePassword] = useState("");
  const [deactivateOtp, setDeactivateOtp] = useState("");

  const toggleEditPreset = async (index) => {
    if (editingPresets[index]) {
      const preset = form.procedurePresetPrices[index];
      
      if (!preset.description || preset.description.trim() === "") {
        return setToast({ show: true, message: "Procedure description cannot be empty", type: "error" });
      }
      if (!preset.category || preset.category.trim() === "") {
        return setToast({ show: true, message: "Category cannot be empty", type: "error" });
      }
      if (preset.unitPrice === "" || isNaN(preset.unitPrice) || Number(preset.unitPrice) < 0) {
        return setToast({ show: true, message: "Price must be a valid number (0 or greater)", type: "error" });
      }

      setEditingPresets(prev => ({...prev, [index]: false}));
      setCustomInputs(prev => ({...prev, [`${index}_desc`]: false, [`${index}_cat`]: false}));
      
      const desc = preset.description.trim() || "Procedure";
      await saveSection("presets", form, `${desc} saved successfully`);
    } else {
      setPresetOriginals(prev => ({...prev, [index]: { ...form.procedurePresetPrices[index] }}));
      setEditingPresets(prev => ({...prev, [index]: true}));
    }
  };

  const cancelEditPreset = (index) => {
    setEditingPresets(prev => ({...prev, [index]: false}));
    setCustomInputs(prev => ({...prev, [`${index}_desc`]: false, [`${index}_cat`]: false}));
    
    if (presetOriginals[index]) {
      setForm(c => {
        const nextPrices = [...c.procedurePresetPrices];
        nextPrices[index] = presetOriginals[index];
        return { ...c, procedurePresetPrices: nextPrices };
      });
    }
  };

  const handleDeletePreset = async (index) => {
    const desc = form.procedurePresetPrices[index]?.description || "Procedure";
    const updatedForm = {
      ...form,
      procedurePresetPrices: form.procedurePresetPrices.filter((_, i) => i !== index)
    };
    setForm(updatedForm);
    setEditingPresets(prev => {
      const next = {...prev};
      delete next[index];
      return Object.keys(next).reduce((acc, key) => {
        const k = parseInt(key);
        if (k < index) acc[k] = next[k];
        if (k > index) acc[k - 1] = next[k];
        return acc;
      }, {});
    });
    setPresetOriginals(prev => {
      const next = {...prev};
      delete next[index];
      return Object.keys(next).reduce((acc, key) => {
        const k = parseInt(key);
        if (k < index) acc[k] = next[k];
        if (k > index) acc[k - 1] = next[k];
        return acc;
      }, {});
    });
    await saveSection("presets", updatedForm, `${desc} deleted successfully`);
  };

  const handleDeleteClick = (index) => {
    const desc = form.procedurePresetPrices[index]?.description || "Procedure";
    setConfirmConfig({
      title: "Delete Procedure Preset",
      message: `Are you sure you want to delete ${desc}? This action cannot be undone.`,
      confirmText: "Delete",
      confirmVariant: "danger",
      onConfirm: async () => {
        setConfirmConfig(null);
        await handleDeletePreset(index);
      }
    });
  };

  const handleAddPreset = () => {
    const newIndex = form.procedurePresetPrices.length;
    const newPreset = { description: "New Procedure", category: "General", unitPrice: 0 };
    setForm(c => ({
      ...c,
      procedurePresetPrices: [...c.procedurePresetPrices, newPreset]
    }));
    setPresetOriginals(prev => ({...prev, [newIndex]: { ...newPreset }}));
    setEditingPresets(prev => ({...prev, [newIndex]: true}));
  };
  
  const storedUser = JSON.parse((localStorage.getItem("user") || sessionStorage.getItem("user")) || "null");
  const currentClinic = {
    ...(storedUser?.clinic || {}),
    ...(billingInfo || {}),
  };
  const hasProAccess = hasActiveProAccess(currentClinic);
  const intakeUrl = currentClinic?.intakePublicToken
    ? `${window.location.origin}/intake/${storedUser?.clinic?.id}?access=${currentClinic.intakePublicToken}`
    : "";

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
    if (!intakeUrl) {
      setToast({ show: true, message: "Generate or enable a secure intake link first", type: "error" });
      return;
    }
    navigator.clipboard.writeText(intakeUrl);
    setCopied(true);
    setToast({ show: true, message: "Intake link copied to clipboard", type: "success" });
    setTimeout(() => setCopied(false), 3000);
  };

  const updateIntakeClinicState = (clinic) => {
    setBillingInfo((current) => ({ ...(current || {}), ...clinic }));
    syncStoredClinic(clinic);
  };

  const handleToggleIntakeAccess = async (nextEnabled) => {
    try {
      setIntakeUpdating(true);
      const response = await api.put("/auth/clinic-profile/intake-link", {
        intakeEnabled: nextEnabled,
      });
      updateIntakeClinicState(response.data?.clinic || {});
      setToast({
        show: true,
        message: response.data?.message || (nextEnabled ? "Patient intake enabled" : "Patient intake disabled"),
        type: "success",
      });
    } catch (err) {
      setToast({ show: true, message: err.response?.data?.message || "Failed to update intake link access", type: "error" });
    } finally {
      setIntakeUpdating(false);
    }
  };

  const handleRegenerateIntakeLink = async () => {
    try {
      setIntakeUpdating(true);
      const response = await api.post("/auth/clinic-profile/intake-link/regenerate");
      updateIntakeClinicState(response.data?.clinic || {});
      setToast({ show: true, message: response.data?.message || "Patient intake link regenerated", type: "success" });
    } catch (err) {
      setToast({ show: true, message: err.response?.data?.message || "Failed to regenerate intake link", type: "error" });
    } finally {
      setIntakeUpdating(false);
    }
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
        setBillingInfo({
          ...(billingResponse.data?.clinic || {}),
          intakeEnabled: clinic?.intakeEnabled || false,
          intakePublicToken: clinic?.intakePublicToken || null,
        });
        if (!hasSavedClinicDraft) {
          setForm({
            clinicName: clinic?.name || "", clinicEmail: clinic?.email || "", clinicPhone: clinic?.phone || "",
            clinicCountry: clinic?.country || "", clinicCity: clinic?.city || "", clinicAddress: clinic?.address || "", contactPerson: clinic?.contactPerson || "",
            logoUrl: clinic?.logoUrl || "", brandColor: clinic?.brandColor || "#0f172a",
            reminderTimezone: clinic?.reminderTimezone || "Africa/Lagos",
            reminderWindowStartHour: String(clinic?.reminderWindowStartHour ?? 8),
            reminderWindowEndHour: String(clinic?.reminderWindowEndHour ?? 18),
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

  const saveSection = async (section, dataToSave, successMsg) => {
    setSaving(true);
    
    let payload = { ...dataToSave };
    
    if (section === "profile") {
      payload.brandColor = billingInfo?.brandColor || "#0f172a";
      payload.procedurePresetPrices = billingInfo?.procedurePresetPrices ? normalizeProcedurePresets(billingInfo.procedurePresetPrices) : payload.procedurePresetPrices;
    } else if (section === "branding") {
      payload.clinicName = billingInfo?.name || payload.clinicName;
      payload.clinicEmail = billingInfo?.email || payload.clinicEmail;
      payload.clinicPhone = billingInfo?.phone || payload.clinicPhone;
      payload.clinicCountry = billingInfo?.country || payload.clinicCountry;
      payload.clinicCity = billingInfo?.city || payload.clinicCity;
      payload.clinicAddress = billingInfo?.address || payload.clinicAddress;
      payload.contactPerson = billingInfo?.contactPerson || payload.contactPerson;
      payload.reminderTimezone = billingInfo?.reminderTimezone || payload.reminderTimezone;
      payload.reminderWindowStartHour = String(billingInfo?.reminderWindowStartHour ?? payload.reminderWindowStartHour ?? 8);
      payload.reminderWindowEndHour = String(billingInfo?.reminderWindowEndHour ?? payload.reminderWindowEndHour ?? 18);
      payload.procedurePresetPrices = billingInfo?.procedurePresetPrices ? normalizeProcedurePresets(billingInfo.procedurePresetPrices) : payload.procedurePresetPrices;
    } else if (section === "presets") {
      payload.clinicName = billingInfo?.name || payload.clinicName;
      payload.clinicEmail = billingInfo?.email || payload.clinicEmail;
      payload.clinicPhone = billingInfo?.phone || payload.clinicPhone;
      payload.clinicCountry = billingInfo?.country || payload.clinicCountry;
      payload.clinicCity = billingInfo?.city || payload.clinicCity;
      payload.clinicAddress = billingInfo?.address || payload.clinicAddress;
      payload.contactPerson = billingInfo?.contactPerson || payload.contactPerson;
      payload.brandColor = billingInfo?.brandColor || "#0f172a";
      payload.logoUrl = billingInfo?.logoUrl || "";
      payload.reminderTimezone = billingInfo?.reminderTimezone || payload.reminderTimezone;
      payload.reminderWindowStartHour = String(billingInfo?.reminderWindowStartHour ?? payload.reminderWindowStartHour ?? 8);
      payload.reminderWindowEndHour = String(billingInfo?.reminderWindowEndHour ?? payload.reminderWindowEndHour ?? 18);
    }

    try {
      const response = await api.put("/auth/clinic-profile", payload);
      const clinic = response.data?.clinic;
      syncStoredClinic(clinic);
      
      if (section === "profile") {
        setForm(c => ({
          ...c,
          clinicName: clinic.name || "",
          clinicEmail: clinic.email || "",
          clinicPhone: clinic.phone || "",
          clinicCountry: clinic.country || "",
          clinicCity: clinic.city || "",
          clinicAddress: clinic.address || "",
          contactPerson: clinic.contactPerson || "",
          logoUrl: clinic.logoUrl || "",
          reminderTimezone: clinic.reminderTimezone || "Africa/Lagos",
          reminderWindowStartHour: String(clinic.reminderWindowStartHour ?? 8),
          reminderWindowEndHour: String(clinic.reminderWindowEndHour ?? 18),
        }));
      } else if (section === "branding") {
        setForm(c => ({
          ...c,
          brandColor: clinic.brandColor || "#0f172a",
          logoUrl: clinic.logoUrl || ""
        }));
      } else if (section === "presets") {
        setForm(c => ({
          ...c,
          procedurePresetPrices: normalizeProcedurePresets(clinic.procedurePresetPrices)
        }));
      }
      
      setBillingInfo((current) => ({ ...(current || {}), ...clinic }));
      setToast({ show: true, message: successMsg || response.data?.message || "Updated successfully", type: "success" });
    } catch (err) { 
      setToast({ show: true, message: err.response?.data?.message || "Failed to update", type: "error" }); 
    } finally { 
      setSaving(false); 
    }
  };

  const handleSaveProfile = (e) => {
    if (e) e.preventDefault();
    saveSection("profile", form, "Profile updated successfully");
  };

  const handleSaveBranding = (e) => {
    if (e) e.preventDefault();
    saveSection("branding", form, "Custom branding saved successfully");
  };

  const initiateDeactivation = async (e) => {
    if (e) e.preventDefault();
    if (!deactivatePassword) return setToast({ show: true, message: "Password is required", type: "error" });
    try {
      setDeactivating(true);
      const res = await api.post("/auth/clinic-profile/deactivate/initiate", { password: deactivatePassword });
      setToast({ show: true, message: res.data.message || "OTP sent to your email", type: "success" });
      setDeactivateStep(2);
    } catch (err) {
      setToast({ show: true, message: err.response?.data?.message || "Failed to initiate deactivation", type: "error" });
    } finally {
      setDeactivating(false);
    }
  };

  const verifyDeactivation = async (e) => {
    e.preventDefault();
    if (!deactivateOtp) return setToast({ show: true, message: "Verification code is required", type: "error" });
    try {
      setDeactivating(true);
      await api.post("/auth/clinic-profile/deactivate/verify", { otp: deactivateOtp });
      await logoutCurrentUser();
      navigate("/login", { replace: true });
    } catch (err) {
      setToast({ show: true, message: err.response?.data?.message || "Failed to verify deactivation code", type: "error" });
    } finally {
      setDeactivating(false);
    }
  };

  const handleDeactivateClinic = () => {
    setDeactivateStep(1);
    setDeactivatePassword("");
    setDeactivateOtp("");
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
                   <div className="relative inline-flex mb-6">
                     <div 
                       className="bg-white rounded-2xl p-2 shadow-sm border border-slate-100 relative group overflow-hidden w-24 h-24 flex items-center justify-center cursor-pointer shrink-0"
                       onClick={() => { if(hasProAccess && !uploadingLogo) document.getElementById('logo-upload-top').click(); else if(!hasProAccess) setToast({show: true, message: "Active Pro access is required to upload a custom logo", type: "error"}); }}
                     >
                       {form.logoUrl ? (
                          <img src={resolveAssetUrl(form.logoUrl)} alt="Clinic Logo" className="w-full h-full object-contain" />
                       ) : (
                          <ImageIcon size={32} className="text-slate-400" />
                       )}
                       <div className={`absolute inset-0 bg-black/50 opacity-0 ${hasProAccess ? 'group-hover:opacity-100' : ''} transition-opacity flex flex-col items-center justify-center`}>
                         <Upload size={20} className="text-white mb-1" />
                         <span className="text-white text-[10px] font-bold">Upload</span>
                       </div>
                     </div>
                     {hasProAccess && form.logoUrl && (
                       <button
                         type="button"
                         className="absolute -top-2 -right-2 bg-white text-slate-400 hover:text-red-500 border border-slate-200 rounded-full p-1.5 shadow-sm transition-colors z-20"
                         onClick={(e) => { e.stopPropagation(); setForm(c => ({...c, logoUrl: ""})); }}
                         title="Remove Logo"
                       >
                         <Trash2 size={14} />
                       </button>
                     )}
                   </div>
                   <input type="file" id="logo-upload-top" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={!hasProAccess || uploadingLogo} />
                   <form onSubmit={handleSaveProfile} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                         <Input label="Clinic Name *" name="clinicName" value={form.clinicName} onChange={handleChange} required icon={Building} className="bg-white" />
                         <Input label="Clinic Email *" name="clinicEmail" type="email" value={form.clinicEmail} onChange={handleChange} required icon={Mail} className="bg-white" />
                         <Input label="Clinic Phone" name="clinicPhone" value={form.clinicPhone} onChange={handleChange} icon={Phone} className="bg-white" />
                         <Select
                            label="Country"
                            name="clinicCountry"
                            value={form.clinicCountry || ""}
                            onChange={handleChange}
                            icon={Globe}
                            className="bg-white"
                         >
                           <option value="" disabled>Select a country</option>
                           {COUNTRIES.map(country => (
                             <option key={country} value={country}>{country}</option>
                           ))}
                         </Select>
                         <Input label="City" name="clinicCity" value={form.clinicCity} onChange={handleChange} icon={MapPin} className="bg-white" />
                         <Input label="Contact Person" name="contactPerson" value={form.contactPerson} onChange={handleChange} icon={User} className="bg-white" />
                         
                         <div className="space-y-1.5 md:col-span-2">
                           <label className="text-sm font-semibold text-slate-700">Clinic Address</label>
                           <textarea name="clinicAddress" value={form.clinicAddress} onChange={handleChange} className="w-full rounded-xl border border-slate-200 p-3 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm resize-none" rows="3" />
                         </div>
                      </div>

                      <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-6">
                         <div className="mb-4">
                           <h3 className="font-bold text-slate-900 text-lg flex items-center mb-1"><Clock size={20} className="mr-2 text-emerald-600" /> Reminder Timing</h3>
                           <p className="text-slate-600 text-sm">Automated appointment reminders follow this timezone and only send during these daily hours.</p>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                           <Select
                             label="Timezone"
                             name="reminderTimezone"
                             value={form.reminderTimezone}
                             onChange={handleChange}
                             icon={Globe}
                             className="bg-white"
                           >
                             {REMINDER_TIMEZONES.map((timezone) => (
                               <option key={timezone.value} value={timezone.value}>
                                 {timezone.label}
                               </option>
                             ))}
                           </Select>
                           <Input
                             label="Start Hour"
                             name="reminderWindowStartHour"
                             type="number"
                             min="0"
                             max="23"
                             value={form.reminderWindowStartHour}
                             onChange={handleChange}
                             icon={Clock}
                             className="bg-white"
                           />
                           <Input
                             label="End Hour"
                             name="reminderWindowEndHour"
                             type="number"
                             min="1"
                             max="23"
                             value={form.reminderWindowEndHour}
                             onChange={handleChange}
                             icon={Clock}
                             className="bg-white"
                           />
                         </div>
                         <p className="mt-4 text-xs text-slate-500">Example: `8` to `18` means reminders can send between 8:00 AM and 6:00 PM in the clinic timezone. Reminders are scheduled for 24 hours and 2 hours before each appointment, during the clinic&apos;s allowed sending hours.</p>
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
                        <p className="text-slate-500 text-sm">Add your distinct brand color to Invoices.</p>
                      </div>
                      {!hasProAccess && (
                        <div className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center border border-amber-200">
                          <Lock size={14} className="mr-1.5" /> PRO Feature
                        </div>
                      )}
                   </div>

                   <div className={`space-y-6 ${!hasProAccess ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Brand Accent Color</label>
                        <div className="flex items-center gap-3">
                           <input type="color" name="brandColor" value={form.brandColor} onChange={handleChange} disabled={!hasProAccess} className="h-10 w-16 rounded border border-slate-200 cursor-pointer p-0.5" />
                           <Input name="brandColor" value={form.brandColor} onChange={handleChange} disabled={!hasProAccess} placeholder="#HEX" className="bg-white" />
                        </div>
                      </div>
                      
                      {hasProAccess && (
                        <div className="pt-4 mt-2">
                           <Button onClick={handleSaveBranding} isLoading={saving} className="shadow-md">
                              <Save size={18} className="mr-2" /> Save Custom Branding
                           </Button>
                        </div>
                      )}
                   </div>
                   {!hasProAccess && (
                     <div className="absolute inset-0 bg-white/40 flex items-center justify-center z-10 backdrop-blur-[1px]">
                        <Button onClick={() => navigate('/upgrade')} className="shadow-lg">Restore Pro Access</Button>
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
                       {!hasProAccess && (
                         <div className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center border border-amber-200">
                           <Lock size={14} className="mr-1.5" /> PRO Feature
                         </div>
                       )}
                    </div>
                    
                    <div className={`mt-4 ${!hasProAccess ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                       <div className="mb-4 flex flex-wrap items-center gap-3">
                          <Button
                            variant={currentClinic?.intakeEnabled ? "outline" : "primary"}
                            onClick={() => handleToggleIntakeAccess(!currentClinic?.intakeEnabled)}
                            isLoading={intakeUpdating}
                            className={currentClinic?.intakeEnabled ? "w-full sm:w-auto bg-white" : "w-full sm:w-auto"}
                          >
                            {currentClinic?.intakeEnabled ? "Disable Link" : "Enable Link"}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleRegenerateIntakeLink}
                            isLoading={intakeUpdating}
                            className="w-full sm:w-auto bg-white"
                          >
                            Regenerate Link
                          </Button>
                          <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border ${currentClinic?.intakeEnabled ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                            {currentClinic?.intakeEnabled ? "Link Active" : "Link Disabled"}
                          </span>
                       </div>
                       <div className="grid grid-cols-[1fr_auto] gap-2 w-full">
                          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-600 font-mono truncate select-all flex items-center">
                             {intakeUrl || "Generate a secure intake link to share with patients"}
                          </div>
                          <Button variant="outline" onClick={handleCopyLink} disabled={!intakeUrl || !currentClinic?.intakeEnabled} className="h-full px-4 bg-white shadow-sm border-slate-300 whitespace-nowrap">
                             {copied ? <CheckCircle size={18} className="text-emerald-500 mr-2" /> : <Copy size={18} className="mr-2" />}
                             {copied ? "Copied" : "Copy"}
                          </Button>
                       </div>
                       <p className="text-xs text-slate-400 mt-3">Only patients with this secure tokenized link can open the intake form. Regenerating the link immediately revokes the old one.</p>
                    </div>

                    {!hasProAccess && (
                      <div className="absolute inset-0 bg-white/40 flex items-center justify-center z-10 backdrop-blur-[1px]">
                         <Button onClick={() => navigate('/upgrade')} className="shadow-lg">Restore Pro Access</Button>
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
                     {form.procedurePresetPrices.map((preset, index) => {
                       const isEditing = editingPresets[index];
                       const showCustomDesc = customInputs[`${index}_desc`];
                       const showCustomCat = customInputs[`${index}_cat`];
                       return (
                       <div key={index} className="bg-white rounded-xl border border-emerald-100 p-4 shadow-sm flex flex-col gap-3 group hover:border-emerald-300 transition-colors">
                          <div className="flex flex-col">
                             <div className="flex-1 mb-3">
                                {isEditing ? (
                                   <>
                                     {showCustomDesc ? (
                                       <div className="flex w-full mb-2">
                                         <input 
                                            autoFocus
                                            value={preset.description} 
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              setForm(c => ({...c, procedurePresetPrices: c.procedurePresetPrices.map((p, i) => i === index ? {...p, description: val} : p)}));
                                            }}
                                            className="flex-1 text-sm font-bold bg-slate-100 border border-emerald-200 rounded-l p-1.5 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800"
                                            placeholder="Type custom procedure..."
                                         />
                                         <button type="button" onClick={() => setCustomInputs(prev => ({...prev, [`${index}_desc`]: false}))} className="bg-slate-200 px-3 border border-l-0 border-emerald-200 rounded-r hover:bg-slate-300 text-slate-600 font-bold">✕</button>
                                       </div>
                                     ) : (
                                       <select 
                                          value={PRESET_DESCRIPTIONS.includes(preset.description) || !preset.description ? preset.description : "custom"} 
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === "custom") {
                                               setCustomInputs(prev => ({...prev, [`${index}_desc`]: true}));
                                               setForm(c => ({...c, procedurePresetPrices: c.procedurePresetPrices.map((p, i) => i === index ? {...p, description: ""} : p)}));
                                            } else {
                                               setForm(c => ({...c, procedurePresetPrices: c.procedurePresetPrices.map((p, i) => i === index ? {...p, description: val} : p)}));
                                            }
                                          }}
                                          className="w-full mb-2 text-sm font-bold bg-slate-100 border border-emerald-200 rounded p-1.5 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 cursor-pointer"
                                       >
                                         <option value="" disabled>Select Procedure</option>
                                         <option value="custom" className="font-bold text-primary-600">-- Type Custom Procedure --</option>
                                         {PRESET_DESCRIPTIONS.map(desc => <option key={desc} value={desc}>{desc}</option>)}
                                         {!PRESET_DESCRIPTIONS.includes(preset.description) && preset.description && <option value={preset.description}>{preset.description}</option>}
                                       </select>
                                     )}

                                     {showCustomCat ? (
                                       <div className="flex w-full">
                                         <input 
                                            autoFocus
                                            value={preset.category} 
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              setForm(c => ({...c, procedurePresetPrices: c.procedurePresetPrices.map((p, i) => i === index ? {...p, category: val} : p)}));
                                            }}
                                            className="flex-1 text-xs font-semibold uppercase tracking-wider bg-slate-100 border border-emerald-200 rounded-l p-1.5 focus:ring-2 focus:ring-emerald-500 outline-none text-emerald-700"
                                            placeholder="Type custom category..."
                                         />
                                         <button type="button" onClick={() => setCustomInputs(prev => ({...prev, [`${index}_cat`]: false}))} className="bg-slate-200 px-3 border border-l-0 border-emerald-200 rounded-r hover:bg-slate-300 text-slate-600 font-bold">✕</button>
                                       </div>
                                     ) : (
                                       <select 
                                          value={PRESET_CATEGORIES.includes(preset.category) || !preset.category ? preset.category : "custom"} 
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === "custom") {
                                               setCustomInputs(prev => ({...prev, [`${index}_cat`]: true}));
                                               setForm(c => ({...c, procedurePresetPrices: c.procedurePresetPrices.map((p, i) => i === index ? {...p, category: ""} : p)}));
                                            } else {
                                               setForm(c => ({...c, procedurePresetPrices: c.procedurePresetPrices.map((p, i) => i === index ? {...p, category: val} : p)}));
                                            }
                                          }}
                                          className="w-full text-xs font-semibold uppercase tracking-wider bg-slate-100 border border-emerald-200 rounded p-1.5 focus:ring-2 focus:ring-emerald-500 outline-none text-emerald-700 cursor-pointer"
                                       >
                                         <option value="" disabled>Select Category</option>
                                         <option value="custom" className="font-bold text-primary-600">-- Type Custom Category --</option>
                                         {PRESET_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                         {!PRESET_CATEGORIES.includes(preset.category) && preset.category && <option value={preset.category}>{preset.category}</option>}
                                       </select>
                                     )}
                                   </>
                                ) : (
                                   <>
                                     <p className="font-bold text-slate-900 text-sm leading-tight">{preset.description}</p>
                                     <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mt-1">{preset.category}</p>
                                   </>
                                )}
                             </div>
                             <div className="flex flex-col items-end justify-center">
                                {isEditing && <span className="text-xs font-semibold text-slate-400 mb-1 w-full text-right">Price (NGN)</span>}
                                {isEditing ? (
                                   <input 
                                      type="number" min="0" step="0.01" 
                                      value={preset.unitPrice} 
                                      onChange={(e) => handleProcedurePriceChange(index, e.target.value)} 
                                      className="w-full text-right font-mono font-bold text-slate-900 border border-emerald-200 rounded p-1.5 text-base bg-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none" 
                                   />
                                ) : (
                                   <div className="text-sm font-bold text-emerald-700 bg-emerald-100/60 px-3 py-1.5 rounded-lg group-hover:bg-emerald-200/60 transition-colors inline-block w-fit text-right">
                                      {formatNaira(preset.unitPrice)}
                                   </div>
                                )}
                             </div>
                          </div>
                          <div className="border-t border-emerald-50 pt-3 flex items-center justify-between">
                            <div className="flex gap-2">
                               {isEditing && (
                                 <Button type="button" size="sm" variant="ghost" onClick={() => cancelEditPreset(index)} className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 px-3">
                                   Cancel
                                 </Button>
                               )}
                               <Button type="button" size="sm" variant={isEditing ? "default" : "outline"} onClick={() => toggleEditPreset(index)} className={isEditing ? "bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-sm" : "text-slate-600 bg-white"}>
                                 {isEditing ? <><Save size={14} className="mr-1.5" /> Save</> : <><Edit2 size={14} className="mr-1.5" /> Edit</>}
                               </Button>
                               <Button type="button" size="sm" variant="ghost" onClick={() => handleDeleteClick(index)} className="text-red-500 hover:text-red-700 hover:bg-red-50 px-2">
                                 <Trash2 size={16} />
                               </Button>
                            </div>
                          </div>
                       </div>
                       );
                     })}
                     <Button type="button" variant="outline" onClick={handleAddPreset} className="w-full border-dashed border-emerald-300 text-emerald-700 hover:bg-emerald-50 py-4">
                       <Plus size={16} className="mr-2" /> Add New Procedure Preset
                     </Button>
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

      {deactivateStep > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center mb-2">
                <AlertTriangle className="text-red-600 mr-2" size={24} />
                Deactivate Clinic
              </h3>
              
              {deactivateStep === 1 && (
                <form onSubmit={initiateDeactivation}>
                  <p className="text-sm font-semibold text-red-600 bg-red-50 p-3 rounded-lg mb-4 border border-red-100">
                    Warning: All clinic data may be lost when deactivated. All staff will be logged out immediately.
                  </p>
                  <p className="text-sm text-slate-600 mb-4">
                    Please enter your password to confirm your identity before proceeding.
                  </p>
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                    <input
                      type="password"
                      value={deactivatePassword}
                      onChange={(e) => setDeactivatePassword(e.target.value)}
                      className="w-full text-sm font-medium bg-slate-50 border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-red-500 outline-none"
                      placeholder="Enter your password"
                      autoFocus
                    />
                  </div>
                  <div className="flex items-center justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => setDeactivateStep(0)}>Cancel</Button>
                    <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white border-0 shadow-sm" isLoading={deactivating}>Continue</Button>
                  </div>
                </form>
              )}

              {deactivateStep === 2 && (
                <form onSubmit={verifyDeactivation}>
                  <p className="text-sm text-slate-600 mb-4">
                    We've sent a 6-digit verification code to your email. Enter it below to complete deactivation.
                  </p>
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Verification Code</label>
                    <input
                      type="text"
                      value={deactivateOtp}
                      onChange={(e) => setDeactivateOtp(e.target.value)}
                      className="w-full text-center text-2xl tracking-widest font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-red-500 outline-none"
                      placeholder="------"
                      maxLength={6}
                      autoFocus
                    />
                  </div>
                  <div className="flex items-center justify-between mb-6">
                    <button type="button" onClick={initiateDeactivation} disabled={deactivating} className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 bg-transparent border-0 outline-none cursor-pointer">
                      Resend Code
                    </button>
                  </div>
                  <div className="flex items-center justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => setDeactivateStep(0)}>Cancel</Button>
                    <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white border-0 shadow-sm" isLoading={deactivating}>Yes, Deactivate</Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
