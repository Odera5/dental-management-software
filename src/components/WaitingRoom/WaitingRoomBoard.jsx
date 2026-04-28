import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Users, Activity, CheckCircle, ChevronDown, ChevronUp, Bell, Search, LogOut, FileText, ArrowRight, ArrowLeft, UserPlus } from "lucide-react";
import api from "../../services/api";
import Toast from "../Toast";
import { getEntityId } from "../../utils/entityId";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { Card, CardContent } from "../ui/Card";
import ConfirmModal from "../ui/ConfirmModal";
import usePersistentState from "../../hooks/usePersistentState";
import { getPatientPickerOptions } from "../../services/patientDirectory";

const STATUS_LABELS = { waiting: "Waiting", called: "Called", in_consultation: "In Consultation", completed: "Completed" };
const NEXT_ACTION = { waiting: "called", called: "in_consultation", in_consultation: "completed" };
const ACTION_LABEL = { waiting: "Call Patient", called: "Start Consultation", in_consultation: "Complete" };

const STATUS_STYLES = {
  waiting: "bg-blue-50 text-blue-700 border-blue-200",
  called: "bg-amber-50 text-amber-700 border-amber-200",
  in_consultation: "bg-emerald-50 text-emerald-700 border-emerald-200",
  completed: "bg-slate-50 text-slate-700 border-slate-200"
};

const METRIC_COLORS = {
  waiting: "bg-blue-600 text-white shadow-blue-500/20",
  called: "bg-amber-500 text-white shadow-amber-500/20",
  in_consultation: "bg-emerald-600 text-white shadow-emerald-500/20",
  completed: "bg-slate-600 text-white shadow-slate-500/20"
};

export default function WaitingRoomBoard({ newPatient = null, preselectPatientId = "" }) {
  const navigate = useNavigate();
  const storedUser = JSON.parse((localStorage.getItem("user") || sessionStorage.getItem("user"))) || {};
  const isFrontDesk = storedUser.role === "nurse";
  const [entries, setEntries] = useState([]);
  const [patients, setPatients] = useState([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [draft, setDraft, clearDraft] = usePersistentState(
    "primuxcare:draft:waiting-room",
    {
      searchQuery: "",
      patientSearchQuery: "",
      statusFilter: "all",
      selectedPatient: "",
      patientPickerOpen: false,
      notes: "",
    },
  );
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [confirmConfig, setConfirmConfig] = useState(null);
  const {
    searchQuery,
    patientSearchQuery,
    statusFilter,
    selectedPatient,
    patientPickerOpen,
    notes,
  } = draft;

  const updateDraft = (patch) =>
    setDraft((current) => ({ ...current, ...patch }));

  useEffect(() => {
    if (preselectPatientId) {
      setDraft((current) => ({ ...current, selectedPatient: preselectPatientId }));
    }
  }, [preselectPatientId, setDraft]);

  const fetchPatients = useCallback(async () => {
    try {
      setPatientsLoading(true);
      const response = await getPatientPickerOptions({
        search: patientSearchQuery,
        limit: 20,
      });
      setPatients(response || []);
    } catch (error) {
      console.error(error);
    } finally {
      setPatientsLoading(false);
    }
  }, [patientSearchQuery]);

  const fetchQueue = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (searchQuery) params.append("search", searchQuery);
      const response = await api.get(`/waiting-room?${params}`);
      setEntries(response.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 8000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  useEffect(() => {
    if ((patientPickerOpen || preselectPatientId) && patients.length === 0 && !patientsLoading) {
      fetchPatients();
    }
  }, [fetchPatients, patientPickerOpen, patients.length, patientsLoading, preselectPatientId]);

  useEffect(() => {
    if (!patientPickerOpen) return undefined;

    const timeoutId = setTimeout(() => {
      fetchPatients();
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [fetchPatients, patientPickerOpen, patientSearchQuery]);

  const showToast = (message, type = "success") => setToast({ show: true, message, type });

  const handleAddToWaitingRoom = async () => {
    if (!selectedPatient) return showToast("Select a patient to add", "error");
    try {
      await api.post("/waiting-room", { patientId: selectedPatient, notes });
      clearDraft();
      showToast("Patient added to waiting room", "success");
      fetchQueue();
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to add patient", "error");
    }
  };

  const handleOpenRecord = (patientId) => {
    if (!patientId) return;
    navigate(`/patients/${patientId}/records`, { state: { returnTo: "/waiting-room" } });
  };

  const handleStatusUpdate = async (item) => {
    const nextStatus = NEXT_ACTION[item.status];
    if (!nextStatus) return;
    if (isFrontDesk && nextStatus !== "called") return showToast("Front desk can only move patients to Called.", "error");

    try {
      await api.put(`/waiting-room/${getEntityId(item)}`, { status: nextStatus });
      showToast(`${item.patientName || item.patientId?.name} moved to ${STATUS_LABELS[nextStatus]}`, "success");
      fetchQueue();
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to update status", "error");
    }
  };

  const executeRemove = async (item) => {
    try {
      await api.delete(`/waiting-room/${getEntityId(item)}`);
      showToast("Patient removed from waiting list", "success");
      fetchQueue();
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to remove patient", "error");
    }
  };

  const handleRemove = (item) => {
    setConfirmConfig({
      title: "Remove from Queue",
      message: `Are you sure you want to remove ${item.patientName || item.patientId?.name} from the waiting list?`,
      confirmText: "Remove",
      danger: true,
      onConfirm: () => executeRemove(item)
    });
  };

  const sectionItems = (status) => entries.filter((entry) => entry.status === status);

  const filteredPatients = patients.filter((patient) => {
    const query = patientSearchQuery.trim().toLowerCase();
    if (!query) return true;
    const searchableText = [patient?.name, patient?.cardNumber, patient?.phone].filter(Boolean).join(" ").toLowerCase();
    return searchableText.includes(query);
  });

  const selectedPatientDetails = patients.find((p) => getEntityId(p) === selectedPatient) || null;

  const formatDate = (value) => {
    if (!value) return "--";
    return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-surface-200">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">Waiting Room</h2>
          <p className="text-sm text-slate-500 max-w-xl">
            Live queue management. Manage patient flow seamlessly from check-in to consultation completion.
          </p>
        </div>
        <Button onClick={fetchQueue} variant="outline" className="w-full md:w-auto bg-white border-slate-200">
          <Activity size={18} className="mr-2" /> Refresh Queue
        </Button>
      </div>

      {newPatient && (
        <div className="rounded-2xl border border-primary-200 bg-primary-50 p-6 flex flex-col md:flex-row gap-4 justify-between items-center shadow-sm">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary-600 mb-1 flex items-center"><UserPlus size={14} className="mr-1" /> Newly Registered</p>
            <h3 className="text-xl font-bold text-slate-900">{newPatient.name}</h3>
            <p className="text-sm text-slate-600 mt-1">Card: <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200">{newPatient.cardNumber || "Pending"}</span></p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Button variant="outline" onClick={() => navigate("/dashboard")} className="w-full sm:w-auto shadow-sm">
              <ArrowLeft size={16} className="mr-2" /> Back
            </Button>
            {!isFrontDesk && (
              <Button variant="outline" onClick={() => handleOpenRecord(getEntityId(newPatient))} className="bg-white hover:bg-slate-100">
                Open Patient Record
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <Card key={key} className="border-0 shadow-sm relative overflow-hidden bg-white">
            <div className={`absolute top-0 left-0 w-1.5 h-full ${METRIC_COLORS[key].split(" ")[0]}`} />
            <CardContent className="p-5 pl-6 flex flex-col items-start">
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">{label}</p>
              <div className="flex items-end gap-3 tracking-tight">
                <span className="text-4xl font-bold text-slate-900 leading-none">{sectionItems(key).length}</span>
                <span className="text-sm font-medium text-slate-400 mb-1 shrink-0">Patients</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="h-fit">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center"><UserPlus size={20} className="mr-2 text-primary-500" /> Walk-in / Check-in</h3>
            <div className="space-y-4">
              <div className="relative">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Select Patient</label>
                <div
                  onClick={() => updateDraft({ patientPickerOpen: !patientPickerOpen })}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 cursor-pointer hover:border-slate-300 transition-colors"
                >
                  <span className={selectedPatientDetails ? "text-slate-900 font-medium" : "text-slate-400"}>
                    {selectedPatientDetails ? selectedPatientDetails.name : "Choose a patient..."}
                  </span>
                  {patientPickerOpen ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                </div>

                <AnimatePresence>
                  {patientPickerOpen && (
                    <div className="absolute z-30 mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
                      <div className="border-b border-slate-100 p-2">
                        <Input autoFocus value={patientSearchQuery} onChange={(e) => updateDraft({ patientSearchQuery: e.target.value })} placeholder="Search name or card..." icon={Search} className="h-10 text-sm" />
                      </div>
                      <div className="max-h-60 overflow-y-auto p-1">
                        {patientsLoading ? (
                          <p className="p-4 text-center text-sm text-slate-500 italic">Loading patients...</p>
                        ) : filteredPatients.length === 0 ? (
                          <p className="p-4 text-center text-sm text-slate-500 italic">No patients matched.</p>
                        ) : (
                          filteredPatients.map((p) => (
                            <button
                              key={getEntityId(p)} type="button"
                              onClick={() => { updateDraft({ selectedPatient: getEntityId(p), patientPickerOpen: false }); }}
                              className={`w-full rounded-lg px-3 py-2.5 text-left transition-colors flex flex-col items-start ${selectedPatient === getEntityId(p) ? "bg-primary-50 pl-4 border-l-2 border-primary-500" : "hover:bg-slate-50 pl-4"}`}
                            >
                              <span className="font-semibold text-slate-900 text-sm">{p.name}</span>
                              <span className="text-xs text-slate-500 font-mono mt-0.5">{p.cardNumber || "No Card"}</span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Triage Notes</label>
                <textarea
                  value={notes} onChange={(e) => updateDraft({ notes: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-3 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm resize-none"
                  rows="3" placeholder="Symptoms, priority..."
                />
              </div>

              <Button onClick={handleAddToWaitingRoom} className="w-full shadow-md py-6">
                Add to Waiting Queue
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <select value={statusFilter} onChange={(e) => updateDraft({ statusFilter: e.target.value })} className="w-full sm:w-auto rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 focus:outline-none shadow-sm">
              <option value="all">All Statuses</option>
              {Object.entries(STATUS_LABELS).map(([key, label]) => (<option key={key} value={key}>{label}</option>))}
            </select>
            <Input value={searchQuery} onChange={(e) => updateDraft({ searchQuery: e.target.value })} placeholder="Search queue..." icon={Search} className="bg-white rounded-full shadow-sm" />
          </div>

          {loading ? (
            <div className="py-20 text-center"><div className="h-8 w-8 mx-auto animate-spin rounded-full border-4 border-primary-600 border-t-transparent mb-4" /><p className="text-slate-500 font-medium">Loading queue data...</p></div>
          ) : entries.length === 0 ? (
            <Card className="border-dashed border-2 bg-slate-50/50"><CardContent className="py-20 flex flex-col items-center justify-center text-slate-500"><Users size={48} className="text-slate-300 mb-4" /><p className="text-lg font-semibold text-slate-700">Empty Queue</p><p className="text-sm">There are no patients waiting matching your criteria.</p></CardContent></Card>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {entries.map((entry) => (
                  <div key={getEntityId(entry)}>
                    <Card className="border border-surface-200 hover:shadow-md transition-all group overflow-hidden relative">
                      <div className={`absolute top-0 left-0 w-1.5 h-full ${STATUS_STYLES[entry.status].split(" ")[0]}`} />
                      <CardContent className="p-4 pl-6 md:p-5 md:pl-7">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h4 className="font-bold text-slate-900 text-lg">{entry.patientName || entry.patientId?.name}</h4>
                              <span className={`px-2 py-0.5 rounded textxs font-semibold uppercase tracking-wider border ${STATUS_STYLES[entry.status]}`}>{STATUS_LABELS[entry.status]}</span>
                            </div>
                            {(entry.patientId?.phone || entry.patientId?.cardNumber) && (
                              <p className="text-sm text-slate-500 mt-1 font-mono">
                                {[entry.patientId?.cardNumber, entry.patientId?.phone].filter(Boolean).join(" | ")}
                              </p>
                            )}

                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3.5 pt-3.5 border-t border-slate-100 text-xs font-medium text-slate-500">
                              <span className="flex items-center"><LogOut size={12} className="mr-1 shrink-0" /> Arrived: {formatDate(entry.arrivalTime)}</span>
                              {entry.calledAt && <span className="flex items-center"><Bell size={12} className="mr-1 shrink-0 text-amber-500" /> Called: {formatDate(entry.calledAt)}</span>}
                              {entry.consultationStartedAt && <span className="flex items-center"><CheckCircle size={12} className="mr-1 shrink-0 text-emerald-500" /> Consult: {formatDate(entry.consultationStartedAt)}</span>}
                            </div>

                            {entry.notes && (
                              <div className="mt-3 bg-slate-50 italic text-slate-600 text-sm p-3 rounded-lg border border-slate-100 flex items-start">
                                <FileText size={16} className="text-slate-400 mr-2 shrink-0 mt-0.5" /> {entry.notes}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col sm:flex-row md:flex-col gap-2 min-w-[140px] shrink-0 border-t pt-3 md:border-t-0 md:pt-0 border-slate-100">
                            {NEXT_ACTION[entry.status] && (!isFrontDesk || NEXT_ACTION[entry.status] === "called") && (
                              <Button onClick={() => handleStatusUpdate(entry)} size="sm" className="w-full bg-slate-800 hover:bg-slate-900 shadow text-white">
                                {ACTION_LABEL[entry.status]} <ArrowRight size={14} className="ml-1.5" />
                              </Button>
                            )}
                            {!isFrontDesk && (
                              <Button variant="outline" size="sm" onClick={() => handleOpenRecord(getEntityId(entry.patientId) || entry.patientId)} className="w-full bg-white">
                                Open Chart
                              </Button>
                            )}
                            {(isFrontDesk || entry.status === "completed") && (
                              <Button variant="ghost" size="sm" onClick={() => handleRemove(entry)} className="w-full text-red-500 hover:bg-red-50 hover:text-red-700">
                                Remove
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
      {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} duration={3000} />}
      <ConfirmModal 
        isOpen={!!confirmConfig} 
        onClose={() => setConfirmConfig(null)} 
        {...confirmConfig} 
      />
    </div>
  );
}
