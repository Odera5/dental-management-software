import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Search, Calendar, Clock, User, Phone, MapPin, Mail, AlertCircle, Link as LinkIcon, Copy, CheckCircle2, RefreshCw, Power, Building2 } from "lucide-react";
import Button from "../components/ui/Button";
import ConfirmModal from "../components/ui/ConfirmModal";
import Toast from "../components/Toast";
import api from "../services/api";
import { hasActiveProAccess, hasEnterpriseAccess } from "../utils/clinicAccess";
import { getStoredUserObject } from "../utils/authStorage";

export default function PendingIntakes() {
  const storedUser = getStoredUserObject() || {};
  const currentRole = storedUser?.role || "nurse";
  const [intakes, setIntakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [processing, setProcessing] = useState(null); // ID of intake being processed
  const [toast, setToast] = useState(null);
  const [pendingRejectIntake, setPendingRejectIntake] = useState(null);
  const [approvalDrafts, setApprovalDrafts] = useState({});
  const [availableSlotsByIntake, setAvailableSlotsByIntake] = useState({});
  const [slotLoadingByIntake, setSlotLoadingByIntake] = useState({});
  const [intakeAccess, setIntakeAccess] = useState(null);
  const [intakeUpdating, setIntakeUpdating] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const showToast = (message, type = "success") => setToast({ message, type });
  const createApprovalDraft = () => ({
    assignedDate: "",
    assignedTime: "",
  });
  const canRegenerateLink = ["admin", "branch_manager"].includes(currentRole);
  const hasProAccess = hasActiveProAccess(intakeAccess?.clinic || storedUser?.clinic || {});
  const enterpriseAccess = hasEnterpriseAccess(intakeAccess?.clinic || storedUser?.clinic || {});
  const intakeLink = intakeAccess?.intakePublicToken
    ? `${window.location.origin}/intake/${intakeAccess.clinicId}?access=${encodeURIComponent(intakeAccess.intakePublicToken)}&branchId=${encodeURIComponent(intakeAccess.branch?.id || "")}`
    : "";

  const syncApprovalDrafts = (items) => {
    setApprovalDrafts((current) => {
      const next = {};

      items.forEach((intake) => {
        next[intake.id] = current[intake.id] || createApprovalDraft(intake);
      });

      return next;
    });
  };

  const loadAvailableSlots = async (intakeId, date, preferredTime = "") => {
    if (!date) {
      setAvailableSlotsByIntake((current) => ({ ...current, [intakeId]: [] }));
      setApprovalDrafts((current) => ({
        ...current,
        [intakeId]: {
          ...(current[intakeId] || {}),
          assignedTime: "",
        },
      }));
      return;
    }

    try {
      setSlotLoadingByIntake((current) => ({ ...current, [intakeId]: true }));
      const response = await api.get(
        `/appointments/available-slots?date=${encodeURIComponent(date)}&duration=30`,
      );
      const nextSlots = response.data?.availableSlots || [];

      setAvailableSlotsByIntake((current) => ({
        ...current,
        [intakeId]: nextSlots,
      }));
      setApprovalDrafts((current) => {
        const currentDraft = current[intakeId] || {};
        const nextAssignedTime = nextSlots.includes(currentDraft.assignedTime)
          ? currentDraft.assignedTime
          : nextSlots.includes(preferredTime)
            ? preferredTime
            : "";

        return {
          ...current,
          [intakeId]: {
            ...currentDraft,
            assignedDate: date,
            assignedTime: nextAssignedTime,
          },
        };
      });
    } catch (error) {
      setAvailableSlotsByIntake((current) => ({ ...current, [intakeId]: [] }));
      showToast(
        error.response?.data?.message || "Failed to load available appointment slots",
        "error",
      );
    } finally {
      setSlotLoadingByIntake((current) => ({ ...current, [intakeId]: false }));
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchIntakes();
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchIntakeAccess();
  }, []);

  const fetchIntakeAccess = async () => {
    try {
      const response = await api.get("/auth/clinic-profile");
      const clinic = response.data?.clinic || {};
      const activeBranch = response.data?.activeBranch || null;

      setIntakeAccess({
        clinicId: clinic.id || storedUser?.clinic?.id || "",
        clinic,
        branch: activeBranch,
        intakeEnabled: Boolean(clinic.intakeEnabled),
        intakePublicToken: clinic.intakePublicToken || null,
      });
    } catch (error) {
      showToast(
        error.response?.data?.message || "Failed to load branch intake settings",
        "error",
      );
    }
  };

  const fetchIntakes = async (background = false) => {
    try {
      if (!background) setLoading(true);
      const res = await api.get(`/pending-intakes?page=${page}&limit=10&search=${encodeURIComponent(debouncedSearch)}`);
      setIntakes(res.data.intakes || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalCount(res.data.totalCount || 0);
      syncApprovalDrafts(res.data.intakes || []);
    } catch (error) {
      console.error("Failed to fetch pending intakes", error);
    } finally {
      if (!background) setLoading(false);
    }
  };

  const handleToggleIntakeAccess = async (nextEnabled) => {
    try {
      setIntakeUpdating(true);
      const response = await api.put("/auth/clinic-profile/intake-link", {
        intakeEnabled: nextEnabled,
      });
      setIntakeAccess((current) => ({
        ...(current || {}),
        intakeEnabled: Boolean(response.data?.clinic?.intakeEnabled),
        intakePublicToken: response.data?.clinic?.intakePublicToken || current?.intakePublicToken || null,
        branch: response.data?.branch || current?.branch || null,
      }));
      showToast(
        response.data?.message ||
          (nextEnabled ? "Patient intake enabled" : "Patient intake disabled"),
        "success",
      );
    } catch (error) {
      showToast(
        error.response?.data?.message || "Failed to update branch intake access",
        "error",
      );
    } finally {
      setIntakeUpdating(false);
    }
  };

  const handleRegenerateIntakeLink = async () => {
    try {
      setIntakeUpdating(true);
      const response = await api.post("/auth/clinic-profile/intake-link/regenerate");
      setIntakeAccess((current) => ({
        ...(current || {}),
        intakeEnabled: Boolean(response.data?.clinic?.intakeEnabled),
        intakePublicToken: response.data?.clinic?.intakePublicToken || null,
        branch: response.data?.branch || current?.branch || null,
      }));
      showToast(response.data?.message || "Patient intake link regenerated", "success");
    } catch (error) {
      showToast(
        error.response?.data?.message || "Failed to regenerate branch intake link",
        "error",
      );
    } finally {
      setIntakeUpdating(false);
    }
  };

  const handleCopyIntakeLink = async () => {
    if (!intakeLink || !intakeAccess?.intakeEnabled) {
      showToast("Enable intake and generate a secure link first", "error");
      return;
    }

    try {
      await navigator.clipboard.writeText(intakeLink);
      setLinkCopied(true);
      showToast("Branch intake link copied to clipboard", "success");
      setTimeout(() => setLinkCopied(false), 3000);
    } catch {
      showToast("Failed to copy intake link", "error");
    }
  };

  const handleApprove = async (intake) => {
    setProcessing(intake.id);
    try {
      const draft = approvalDrafts[intake.id] || createApprovalDraft(intake);
      await api.post(`/pending-intakes/${intake.id}/approve`, {
        assignedDate: draft.assignedDate,
        assignedTime: draft.assignedTime,
      });
      setIntakes(intakes.filter(i => i.id !== intake.id));
      setApprovalDrafts((current) => {
        const next = { ...current };
        delete next[intake.id];
        return next;
      });
      setAvailableSlotsByIntake((current) => {
        const next = { ...current };
        delete next[intake.id];
        return next;
      });
      showToast(`${intake.name} has been approved and registered!`, "success");

      if (intakes.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        fetchIntakes(true);
      }
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to approve intake", "error");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (intake) => {
    setProcessing(intake.id);
    try {
      await api.delete(`/pending-intakes/${intake.id}`);
      setIntakes(intakes.filter(i => i.id !== intake.id));
      showToast("Intake request declined", "success");

      if (intakes.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        fetchIntakes(true);
      }
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to reject intake", "error");
    } finally {
      setProcessing(null);
      setPendingRejectIntake(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="p-6 max-w-7xl mx-auto">
      {toast && <Toast message={toast.message} type={toast.type} duration={3000} onClose={() => setToast(null)} />}
      <ConfirmModal
        isOpen={Boolean(pendingRejectIntake)}
        onClose={() => setPendingRejectIntake(null)}
        onConfirm={() => {
          if (pendingRejectIntake) {
            handleReject(pendingRejectIntake);
          }
        }}
        title="Decline Intake Request"
        message={
          pendingRejectIntake
            ? `Are you sure you want to decline ${pendingRejectIntake.name}'s intake request? This cannot be undone.`
            : "Are you sure you want to decline this intake request? This cannot be undone."
        }
        confirmText="Decline Intake"
        cancelText="Keep Request"
        confirmLoading={processing === pendingRejectIntake?.id}
        closeOnConfirm={false}
        danger
      />
      
      <div className="mb-8 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Pending Intakes</h1>
            <p className="text-slate-500 mt-1">Review and approve online patient registrations.</p>
          </div>
          <div className="relative max-w-xs w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl bg-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <LinkIcon size={18} className="text-primary-600" />
                {enterpriseAccess ? "Branch Intake Link" : "Patient Intake Link"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Enable, copy, and manage the secure intake link for {enterpriseAccess ? "the branch you are currently working in" : "your clinic"}.
              </p>
            </div>
            {enterpriseAccess && (
              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest ${intakeAccess?.intakeEnabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                <Building2 size={12} />
                {intakeAccess?.branch?.city || intakeAccess?.branch?.name || "Current branch"}
              </span>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button
              variant={intakeAccess?.intakeEnabled ? "outline" : "primary"}
              onClick={() => handleToggleIntakeAccess(!intakeAccess?.intakeEnabled)}
              isLoading={intakeUpdating}
              disabled={!hasProAccess}
              className={intakeAccess?.intakeEnabled ? "w-full sm:w-auto bg-white" : "w-full sm:w-auto"}
            >
              <Power size={16} className="mr-2" />
              {intakeAccess?.intakeEnabled ? "Disable Intake" : "Enable Intake"}
            </Button>
            {canRegenerateLink && (
              <Button
                variant="outline"
                onClick={handleRegenerateIntakeLink}
                isLoading={intakeUpdating}
                disabled={!hasProAccess}
                className="w-full sm:w-auto bg-white"
              >
                <RefreshCw size={16} className="mr-2" />
                Regenerate Link
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleCopyIntakeLink}
              disabled={!hasProAccess || !intakeAccess?.intakeEnabled || !intakeLink}
              className="w-full sm:w-auto bg-white"
            >
              {linkCopied ? <CheckCircle2 size={16} className="mr-2 text-emerald-600" /> : <Copy size={16} className="mr-2" />}
              {linkCopied ? "Copied" : "Copy Link"}
            </Button>
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <div className="truncate font-mono">
              {intakeLink || "Enable intake for this branch to generate a secure share link."}
            </div>
          </div>

          <p className="mt-3 text-xs leading-5 text-slate-400">
            Doctors, nurses, and branch managers can enable or disable intake for the current branch. Only admins and branch managers can regenerate the secure link because regeneration revokes the old one immediately.
          </p>
          {!hasProAccess && (
            <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800">
              Active Pro or Enterprise access is required before branch intake links can be used.
            </p>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary-600"></div>
        </div>
      ) : intakes.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
             <AlertCircle size={32} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">No pending intakes</h3>
          <p className="text-slate-500 max-w-md mx-auto">You're all caught up! When patients fill out your online intake form, they will appear here for your review.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnimatePresence>
            {intakes.map((intake) => {
              const approvalDraft = approvalDrafts[intake.id] || createApprovalDraft(intake);
              const availableSlots = availableSlotsByIntake[intake.id] || [];
              const slotLoading = Boolean(slotLoadingByIntake[intake.id]);
              const hasPartialAssignment =
                (approvalDraft.assignedDate && !approvalDraft.assignedTime) ||
                (!approvalDraft.assignedDate && approvalDraft.assignedTime);

              return (
                <motion.div
                  key={intake.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
              >
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start">
                   <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg border border-primary-200 shrink-0">
                        {intake.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{intake.name}</h3>
                        <p className="text-sm text-slate-500 flex items-center gap-1">
                          <User size={14}/> {intake.age} yrs • {intake.gender}
                        </p>
                      </div>
                   </div>
                   <div className="text-xs font-medium bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full border border-amber-200">
                      Pending
                   </div>
                </div>

                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                   <div className="space-y-3">
                      <div className="flex items-start gap-2 text-slate-600">
                        <Phone size={16} className="mt-0.5 shrink-0 text-slate-400" />
                        <span className="break-words">{intake.phone || "Not provided"}</span>
                      </div>
                      <div className="flex items-start gap-2 text-slate-600">
                        <Mail size={16} className="mt-0.5 shrink-0 text-slate-400" />
                        <span className="break-words">{intake.email || "Not provided"}</span>
                      </div>
                      <div className="flex items-start gap-2 text-slate-600">
                        <MapPin size={16} className="mt-0.5 shrink-0 text-slate-400" />
                        <span className="break-words">{intake.address || "Not provided"}</span>
                      </div>
                   </div>

                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                       <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Preferred Appointment</h4>
                       {intake.preferredDate ? (
                        <>
                           <div className="flex items-center gap-2 text-slate-800 font-medium mb-1.5">
                             <Calendar size={16} className="text-primary-500"/>
                             {new Date(intake.preferredDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                           </div>
                           <div className="flex items-center gap-2 text-slate-600">
                             <Clock size={16} className="text-primary-500"/>
                             {intake.preferredTime || "Any time"}
                           </div>
                        </>
                      ) : (
                        <p className="text-slate-500 italic">No preference selected</p>
                      )}
                    </div>
                 </div>

                 {intake.nextOfKinName && (
                   <div className="px-5 pb-3">
                     <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                       <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 text-slate-500">
                         Next of Kin / Emergency Contact
                       </h4>
                       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-700">
                         <div>
                           <span className="font-semibold text-slate-400 block mb-0.5">Name</span>
                           <span className="font-semibold text-slate-800">{intake.nextOfKinName}</span>
                         </div>
                         <div>
                           <span className="font-semibold text-slate-400 block mb-0.5">Relationship</span>
                           <span className="font-semibold text-slate-800">{intake.nextOfKinRelationship || "Not specified"}</span>
                         </div>
                         <div>
                           <span className="font-semibold text-slate-400 block mb-0.5">Phone</span>
                           <span className="font-semibold text-slate-800">{intake.nextOfKinPhone || "Not specified"}</span>
                         </div>
                         <div>
                           <span className="font-semibold text-slate-400 block mb-0.5">Address</span>
                           <span className="font-semibold text-slate-800 break-words">{intake.nextOfKinAddress || "Not specified"}</span>
                         </div>
                       </div>
                     </div>
                   </div>
                 )}

                 <div className="px-5 pb-5">
                   <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                     <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                       Assign Appointment
                     </h4>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                       <div className="space-y-1.5">
                         <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                           Date
                         </label>
                         <input
                           type="date"
                           value={approvalDraft.assignedDate}
                           onChange={(event) => {
                             const nextDate = event.target.value;
                             setApprovalDrafts((current) => ({
                               ...current,
                               [intake.id]: {
                                 ...(current[intake.id] || createApprovalDraft(intake)),
                                 assignedDate: nextDate,
                                 assignedTime: "",
                               },
                             }));
                             loadAvailableSlots(intake.id, nextDate, intake.preferredTime || "");
                           }}
                           className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                         />
                       </div>
                       <div className="space-y-1.5">
                         <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                           Time
                         </label>
                        <select
                          value={approvalDraft.assignedTime}
                          onFocus={() => {
                            if (
                              approvalDraft.assignedDate &&
                              !slotLoading &&
                              availableSlots.length === 0
                            ) {
                              loadAvailableSlots(
                                intake.id,
                                approvalDraft.assignedDate,
                                intake.preferredTime || "",
                              );
                            }
                          }}
                          onChange={(event) =>
                            setApprovalDrafts((current) => ({
                              ...current,
                               [intake.id]: {
                                 ...(current[intake.id] || createApprovalDraft(intake)),
                                 assignedTime: event.target.value,
                               },
                             }))
                           }
                           disabled={!approvalDraft.assignedDate || slotLoading || availableSlots.length === 0}
                           className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-slate-100 disabled:text-slate-400"
                         >
                           <option value="">
                             {!approvalDraft.assignedDate
                               ? "Select a date first"
                               : slotLoading
                                 ? "Loading available times..."
                                 : availableSlots.length === 0
                                   ? "No free times"
                                   : "Select a time"}
                           </option>
                           {availableSlots.map((slot) => (
                             <option key={slot} value={slot}>
                               {slot}
                             </option>
                           ))}
                         </select>
                       </div>
                     </div>
                     <p className="mt-3 text-xs text-slate-500">
                       Leave both fields blank if you only want to register the patient for now without booking a slot yet.
                     </p>
                   </div>
                 </div>

                 <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                   <Button 
                    className="flex-1" 
                    variant="outline" 
                    onClick={() => setPendingRejectIntake(intake)}
                    disabled={processing === intake.id}
                  >
                     <X size={16} className="mr-2" /> Decline
                  </Button>
                   <Button 
                     className="flex-1 bg-primary-600 hover:bg-primary-700 text-white shadow-sm"
                     onClick={() => handleApprove(intake)}
                     disabled={hasPartialAssignment}
                     isLoading={processing === intake.id}
                   >
                      <Check size={16} className="mr-2" /> Approve & Register
                   </Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
      
      {!loading && totalPages > 1 && (
        <div className="mt-8 flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="bg-white"
          >
            Previous
          </Button>
          <span className="text-sm text-slate-500 font-medium">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page === totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            className="bg-white"
          >
            Next
          </Button>
        </div>
      )}
    </motion.div>
  );
}
