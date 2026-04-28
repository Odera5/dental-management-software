import React, { useCallback, useDeferredValue, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Users, Calendar, Activity, CreditCard, Search, RefreshCw, ArchiveRestore, Trash2, Upload, Download, Lock
} from "lucide-react";
import Papa from "papaparse";
import CsvImportModal from "../components/Patients/CsvImportModal";
import api from "../services/api";
import Toast from "../components/Toast";
import { getEntityId } from "../utils/entityId";
import { Card, CardContent } from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import ConfirmModal from "../components/ui/ConfirmModal";
import usePersistentState from "../hooks/usePersistentState";
import {
  getDashboardSummary,
  subscribeDashboardSummary,
  readDashboardSummaryCache,
} from "../services/dashboardSummary";

const PATIENTS_PER_PAGE = 25;

const formatLocalDateKey = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const defaultWaitingSummary = { waiting: 0, called: 0, in_consultation: 0, completed: 0, total: 0 };

const shouldSuppressDashboardError = (error) => {
  const status = error?.response?.status;
  const message = String(error?.response?.data?.message || error?.message || "").toLowerCase().trim();
  if ([400, 404].includes(status)) return true;
  return message.includes("not found") || message.includes("no appointment") || message.includes("no invoice") || message.includes("no record") || message.includes("no data");
};

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const cachedSummary = readDashboardSummaryCache().data;

  const storedUser = JSON.parse((localStorage.getItem("user") || sessionStorage.getItem("user"))) || {};
  const user = {
    role: storedUser.role || "nurse",
  };
  
  const canViewRecords = ["admin", "doctor", "nurse"].includes(user.role);
  const canDeletePatients = ["admin", "doctor", "nurse"].includes(user.role);

  const [patients, setPatients] = useState([]);
  const [patientsToday, setPatientsToday] = useState(
    cachedSummary?.patients?.today || 0,
  );
  const [appointmentsToday, setAppointmentsToday] = useState(
    cachedSummary?.appointments?.today || 0,
  );
  const [scheduledAppointments, setScheduledAppointments] = useState(
    cachedSummary?.appointments?.scheduled || 0,
  );
  const [waitingSummary, setWaitingSummary] = useState(
    cachedSummary?.waitingRoom || defaultWaitingSummary,
  );
  const [monthlyRevenue, setMonthlyRevenue] = useState(
    cachedSummary?.billing?.monthlyRevenue || 0,
  );
  const [trash, setTrash] = useState([]);
  const [directoryState, setDirectoryState] = usePersistentState(
    "primuxcare:draft:dashboard-directory",
    { searchQuery: "", sortConfig: { key: null, direction: "asc" }, currentPage: 1 },
  );
  const { searchQuery, sortConfig, currentPage } = directoryState;
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [currentDay, setCurrentDay] = useState(formatLocalDateKey());
  const [showImportModal, setShowImportModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState(null);
  const [patientTotal, setPatientTotal] = useState(0);
  const [patientTotalPages, setPatientTotalPages] = useState(1);

  const showTrash = location.search.includes("tab=trash");
  const clinicPlan = storedUser?.clinic?.plan || "FREE";
  const deferredSearchQuery = useDeferredValue(searchQuery.trim());

  const showToast = (message, type = "success") => setToast({ message, type });

  const applySummary = useCallback((summary = {}) => {
    setPatientsToday(summary?.patients?.today || 0);
    setAppointmentsToday(summary?.appointments?.today || 0);
    setScheduledAppointments(summary?.appointments?.scheduled || 0);
    setWaitingSummary(summary?.waitingRoom || defaultWaitingSummary);
    setMonthlyRevenue(summary?.billing?.monthlyRevenue || 0);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeDashboardSummary((summary) => {
      applySummary(summary || {});
    });

    return () => {
      unsubscribe();
    };
  }, [applySummary]);

  const exportCSV = () => {
    if (clinicPlan === "FREE") {
      setShowUpgradeModal(true);
      return;
    }
    const runExport = async () => {
      try {
        const res = await api.get("/patients");
        const exportPatients = Array.isArray(res.data) ? res.data : [];

        if (exportPatients.length === 0) {
          showToast("No patients to export", "error");
          return;
        }

        const csvData = exportPatients.map((p) => ({
          Name: p.name,
          Age: p.age,
          Gender: p.gender,
          Phone: p.phone,
          Email: p.email,
          Address: p.address,
          CardNumber: p.cardNumber,
          CreatedAt: new Date(p.createdAt).toLocaleString()
        }));

        const csv = Papa.unparse(csvData);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", `patients_export_${new Date().getTime()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast("Export successful!");
      } catch (err) {
        console.error(err);
        showToast("Failed to export patients", "error");
      }
    };

    runExport();
  };

  const handleImportClick = () => {
    if (clinicPlan === "FREE") {
      setShowUpgradeModal(true);
      return;
    }
    setShowImportModal(true);
  };

  const handleImportSuccess = (count) => {
    setShowImportModal(false);
    showToast(`Successfully imported ${count} legacy patient records!`);
    fetchPatients();
    fetchSummary();
  };

  const fetchSummary = useCallback(async () => {
    try {
      const cachedSummary = readDashboardSummaryCache();
      if (cachedSummary.data) {
        applySummary(cachedSummary.data);
      }

      const summary = await getDashboardSummary();
      applySummary(summary);
    } catch (err) {
      console.error(err);
      applySummary();
      if (!shouldSuppressDashboardError(err)) showToast("Failed to load dashboard summary", "error");
    }
  }, [applySummary]);

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/patients", {
        params: {
          page: currentPage,
          limit: PATIENTS_PER_PAGE,
          search: deferredSearchQuery || undefined,
          sortBy: sortConfig.key || undefined,
          sortDirection: sortConfig.direction || undefined,
        },
      });
      const pageData = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
          ? res.data
          : [];

      setPatients(pageData.filter((p) => p && !p.isDeleted));
      setPatientTotal(Number(res.data?.total) || pageData.length);
      setPatientTotalPages(Number(res.data?.totalPages) || 1);
    } catch (err) {
      console.error(err);
      setPatients([]);
      setPatientTotal(0);
      setPatientTotalPages(1);
      showToast("Failed to load patients", "error");
    } finally {
      setLoading(false);
    }
  }, [currentPage, deferredSearchQuery, sortConfig.direction, sortConfig.key]);

  const fetchTrash = useCallback(async () => {
    if (user.role !== "admin") return;
    try {
      const res = await api.get("/patients/trash/all");
      setTrash((res.data || []).map((p) => ({ ...p, name: p.name || p.fullName || "Unknown" })));
    } catch (err) {
      console.error(err);
      setTrash([]);
      if (!shouldSuppressDashboardError(err)) showToast("Failed to load trash", "error");
    }
  }, [user.role]);

  useEffect(() => {
    if (showTrash) return;
    fetchPatients();
    fetchSummary();
  }, [fetchPatients, fetchSummary, showTrash]);

  useEffect(() => {
    if (showTrash && user.role === "admin") {
      fetchTrash();
    }
  }, [fetchTrash, showTrash, user.role]);

  useEffect(() => {
    if (location.state?.newPatient) {
      fetchPatients();
      fetchSummary();
      window.history.replaceState({}, document.title);
    }
  }, [fetchPatients, fetchSummary, location.state]);

  useEffect(() => {
    const today = formatLocalDateKey();
    if (today !== currentDay) setCurrentDay(today);
  }, [currentDay]);

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
    setDirectoryState((current) => ({ ...current, sortConfig: { key, direction } }));
  };

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const sortedTrash = sortConfig.key
    ? [...trash].sort((a, b) => {
        if (!a[sortConfig.key]) return 1;
        if (!b[sortConfig.key]) return -1;
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === "asc" ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      })
    : [...trash];
  const matchesSearch = (patient) => {
    if (!normalizedSearchQuery) return true;
    return [patient?.name, patient?.cardNumber].filter(Boolean).map(v => String(v).toLowerCase()).some(v => v.includes(normalizedSearchQuery));
  };

  const activeList = showTrash ? sortedTrash.filter(matchesSearch) : patients.filter((p) => p && p.name);
  const totalPages = showTrash ? Math.max(1, Math.ceil(activeList.length / PATIENTS_PER_PAGE)) : Math.max(1, patientTotalPages);
  const currentPageSafe = Math.min(currentPage, totalPages);
  const pageStartIndex = (currentPageSafe - 1) * PATIENTS_PER_PAGE;
  const paginatedPatients = showTrash ? activeList.slice(pageStartIndex, pageStartIndex + PATIENTS_PER_PAGE) : activeList;
  const totalResults = showTrash ? activeList.length : patientTotal;

  useEffect(() => {
    setDirectoryState((current) => ({ ...current, currentPage: 1 }));
  }, [searchQuery, setDirectoryState, showTrash, sortConfig]);
  useEffect(() => {
    if (currentPage > totalPages) {
      setDirectoryState((current) => ({ ...current, currentPage: totalPages }));
    }
  }, [currentPage, setDirectoryState, totalPages]);

  const executeDelete = async (patientId) => {
    try {
      const res = await api.delete(`/patients/${patientId}`);
      if (res.status === 200) {
        fetchPatients();
        fetchTrash();
        fetchSummary();
        showToast(res.data.message || "Patient moved to Trash");
      } else showToast("Failed to delete patient", "error");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete patient", "error");
    }
  };

  const handleDelete = (patientId) => {
    setConfirmConfig({
      title: "Move to Trash",
      message: "Move this patient to the Trash? You can restore them later if needed.",
      confirmText: "Move to Trash",
      danger: true,
      onConfirm: () => executeDelete(patientId)
    });
  };

  const handleRestore = async (patientId) => {
    try {
      const res = await api.put(`/patients/${patientId}/restore`);
      if (res.status === 200) {
        fetchPatients();
        fetchTrash();
        fetchSummary();
        showToast("Patient restored successfully");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to restore patient", "error");
    }
  };

  const executePermanentDelete = async (patientId) => {
    try {
      const res = await api.delete(`/patients/${patientId}/permanent`);
      if (res.status === 200) {
        fetchPatients();
        fetchTrash();
        fetchSummary();
        showToast("Patient permanently deleted");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to permanently delete patient", "error");
    }
  };

  const handlePermanentDelete = (patientId) => {
    setConfirmConfig({
      title: "Delete Permanently",
      message: "Permanently delete this patient? This action cannot be undone and all associated records will be lost.",
      confirmText: "Delete Forever",
      danger: true,
      onConfirm: () => executePermanentDelete(patientId)
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="p-4 md:p-6 space-y-8 h-full">
      {toast && <Toast message={toast.message} type={toast.type} duration={3000} onClose={() => setToast(null)} />}
      {showImportModal && (
        <CsvImportModal 
          onClose={() => setShowImportModal(false)}
          onSuccess={handleImportSuccess}
        />
      )}

      {!showTrash && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mt-2">
                <div>
                  <p className="text-sm font-medium text-slate-500">Patients Today</p>
                  <h3 className="text-3xl font-bold text-slate-900 mt-2">{patientsToday}</h3>
                </div>
                <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600">
                  <Users size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mt-2">
                <div>
                  <p className="text-sm font-medium text-slate-500">Appointments</p>
                  <h3 className="text-3xl font-bold text-slate-900 mt-2 flex items-center">
                    {scheduledAppointments}
                    <span className="ml-3 text-xs font-bold uppercase tracking-widest bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full shadow-sm">
                      Today {appointmentsToday}
                    </span>
                  </h3>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                  <Calendar size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mt-2">
                <div>
                  <p className="text-sm font-medium text-slate-500">Waiting Room</p>
                  <h3 className="text-3xl font-bold text-slate-900 mt-2">{waitingSummary.waiting}</h3>
                </div>
                <div className="p-3 bg-amber-100 rounded-xl text-amber-600">
                  <Activity size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mt-2">
                <div>
                  <p className="text-sm font-medium text-slate-500">Revenue</p>
                  <h3 className="text-3xl font-bold text-slate-900 mt-2 tracking-tight">
                    <span className="text-lg text-slate-400 font-medium align-top mr-1">₦</span>
                    {monthlyRevenue.toLocaleString()}
                  </h3>
                </div>
                <div className="p-3 bg-primary-100 rounded-xl text-primary-600">
                  <CreditCard size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-surface-200 bg-surface-50 flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full lg:w-auto">
            <h2 className="text-lg font-semibold text-slate-800 shrink-0">
              {showTrash ? "Deleted Records" : "Patient Directory"}
            </h2>
            
            {/* Search Bar - Shifted towards the center/next to title */}
            <div className="w-full sm:w-72 lg:ml-4">
              <Input 
                placeholder="Search by name or card..."
                value={searchQuery}
                onChange={(e) => setDirectoryState((current) => ({ ...current, searchQuery: e.target.value }))}
                icon={Search}
                className="bg-white"
              />
            </div>
          </div>

          {!showTrash && canViewRecords && (
            <div className="flex flex-row items-center gap-3 shrink-0 mt-4 lg:mt-0">
              <Button variant="outline" size="sm" onClick={exportCSV} className="px-4 py-1.5 h-9 text-sm bg-white shadow-sm border-slate-300 whitespace-nowrap">
                <Download size={14} className="mr-2 shrink-0" /> Export
                {clinicPlan === "FREE" && <Lock size={12} className="ml-1.5 text-amber-500 shrink-0" />}
              </Button>
              <Button variant="outline" size="sm" onClick={handleImportClick} className="px-4 py-1.5 h-9 text-sm bg-white shadow-sm border-slate-300 whitespace-nowrap">
                <Upload size={14} className="mr-2 shrink-0" /> Import
                {clinicPlan === "FREE" && <Lock size={12} className="ml-1.5 text-amber-500 shrink-0" />}
              </Button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 border-b border-surface-200">
              <tr>
                <th className="px-6 py-4 font-semibold cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort("name")}>
                  Patient Name
                </th>
                <th className="px-6 py-4 font-semibold cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort("age")}>
                  Age
                </th>
                <th className="px-6 py-4 font-semibold">Card Number</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                    <RefreshCw className="mx-auto h-6 w-6 animate-spin mb-2" />
                    Loading records...
                  </td>
                </tr>
              ) : paginatedPatients.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-16 text-center text-slate-500">
                     <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="bg-slate-50 p-4 rounded-full border border-slate-200 text-slate-400 mb-2">
                          {showTrash ? <Trash2 size={32} /> : searchQuery ? <Search size={32} /> : <Users size={32} />}
                        </div>
                        <h3 className="text-lg font-bold text-slate-700">
                          {searchQuery ? "No matches found" : showTrash ? "Trash is empty" : "No patients yet"}
                        </h3>
                        <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
                          {searchQuery 
                            ? "We couldn't find any patients matching that search. Try adjusting your key words." 
                            : showTrash 
                              ? "Your deleted records will appear here. Currently, it's squeaky clean!" 
                              : "Your clinic database is waiting. Start by securely registering your first patient!"}
                        </p>
                     </div>
                  </td>
                </tr>
              ) : (
                paginatedPatients.map((p) => {
                  const patientId = getEntityId(p);
                  const isToday = formatLocalDateKey(p.createdAt) === currentDay;
                  return (
                    <tr key={patientId} className={`hover:bg-slate-50 transition-colors ${!showTrash && isToday ? "bg-primary-50/50" : ""}`}>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{p.name}</div>
                        {isToday && !showTrash && <span className="inline-flex mt-1 items-center px-2 py-0.5 rounded text-[10px] font-medium bg-primary-100 text-primary-800">New Today</span>}
                      </td>
                      <td className="px-6 py-4">{p.age}</td>
                      <td className="px-6 py-4"><span className="font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">{p.cardNumber || "--"}</span></td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {!showTrash && canViewRecords && (
                            <Button variant="outline" size="sm" onClick={() => navigate(`/patients/${patientId}/records`)}>
                              Records
                            </Button>
                          )}
                          {showTrash ? (
                            <>
                              <Button variant="outline" size="sm" className="text-emerald-600 border-emerald-200 hover:text-emerald-800 hover:bg-emerald-50" onClick={() => handleRestore(patientId)}>
                                <ArchiveRestore size={16} className="mr-1" /> Restore
                              </Button>
                              <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handlePermanentDelete(patientId)}>
                                Delete Forever
                              </Button>
                            </>
                          ) : canDeletePatients ? (
                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(patientId)}>
                              <Trash2 size={18} />
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-surface-200 bg-surface-50 gap-4">
          <p className="text-sm text-slate-500">
            Showing <span className="font-medium text-slate-900">{totalResults > 0 ? pageStartIndex + 1 : 0}</span> to <span className="font-medium text-slate-900">{Math.min(pageStartIndex + PATIENTS_PER_PAGE, totalResults)}</span> of <span className="font-medium text-slate-900">{totalResults}</span> results
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setDirectoryState((current) => ({ ...current, currentPage: Math.max(1, current.currentPage - 1) }))} disabled={currentPageSafe <= 1}>
              Previous
            </Button>
            <div className="flex items-center px-4 text-sm font-medium text-slate-700 whitespace-nowrap">
              {currentPageSafe} / {totalPages}
            </div>
            <Button variant="outline" size="sm" onClick={() => setDirectoryState((current) => ({ ...current, currentPage: Math.min(totalPages, current.currentPage + 1) }))} disabled={currentPageSafe >= totalPages}>
              Next
            </Button>
          </div>
        </div>
      </div>

      {showUpgradeModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
              <Lock size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Pro Plan Feature</h3>
            <p className="text-slate-500 text-sm mb-6">
              Bulk Importing legacy patients and Exporting your patient database are restricted to the PRO tier. Upgrade your clinic to automatically migrate unlimited patients.
            </p>
            <div className="flex w-full gap-3">
              <Button type="button" variant="outline" className="flex-1 border-slate-200" onClick={() => setShowUpgradeModal(false)}>Close</Button>
              <Button type="button" className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-lg font-bold" onClick={() => navigate("/upgrade")}>Upgrade Now</Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={!!confirmConfig} 
        onClose={() => setConfirmConfig(null)} 
        {...confirmConfig} 
      />
    </motion.div>
  );
}
