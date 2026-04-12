import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Users, Calendar, Activity, CreditCard, Search, RefreshCw, ArchiveRestore, Trash2
} from "lucide-react";
import api from "../services/api";
import Toast from "../components/Toast";
import { getEntityId } from "../utils/entityId";
import { Card, CardContent } from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";

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

  const storedUser = JSON.parse((localStorage.getItem("user") || sessionStorage.getItem("user"))) || {};
  const user = {
    role: storedUser.role || "nurse",
  };
  
  const canViewRecords = ["admin", "doctor", "nurse"].includes(user.role);
  const canDeletePatients = ["admin", "doctor", "nurse"].includes(user.role);

  const [patients, setPatients] = useState([]);
  const [patientsToday, setPatientsToday] = useState([]);
  const [appointmentsToday, setAppointmentsToday] = useState(0);
  const [waitingSummary, setWaitingSummary] = useState(defaultWaitingSummary);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [trash, setTrash] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [currentDay, setCurrentDay] = useState(formatLocalDateKey());
  const [currentPage, setCurrentPage] = useState(1);

  const showTrash = location.search.includes("tab=trash");

  const showToast = (message, type = "success") => setToast({ message, type });

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await api.get("/patients");
      const activePatients = (res.data || []).filter((p) => p && !p.isDeleted);
      setPatients(activePatients.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (err) {
      console.error(err);
      showToast("Failed to load patients", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchTrash = async () => {
    if (user.role !== "admin") return;
    try {
      const res = await api.get("/patients/trash/all");
      setTrash((res.data || []).map((p) => ({ ...p, name: p.name || p.fullName || "Unknown" })));
    } catch (err) {
      console.error(err);
      setTrash([]);
      if (!shouldSuppressDashboardError(err)) showToast("Failed to load trash", "error");
    }
  };

  const fetchAppointmentsToday = async () => {
    try {
      const today = formatLocalDateKey();
      const res = await api.get(`/appointments?startDate=${today}&endDate=${today}`);
      setAppointmentsToday(res.data?.length || 0);
    } catch (err) {
      console.error(err);
      setAppointmentsToday(0);
      if (!shouldSuppressDashboardError(err)) showToast("Failed to load today's appointments", "error");
    }
  };

  const fetchWaitingSummary = async () => {
    try {
      const res = await api.get("/waiting-room/summary");
      setWaitingSummary(res.data || defaultWaitingSummary);
    } catch (err) {
      console.error(err);
      setWaitingSummary(defaultWaitingSummary);
      if (!shouldSuppressDashboardError(err)) showToast("Failed to load waiting room summary", "error");
    }
  };

  const fetchMonthlyRevenue = async () => {
    try {
      const now = new Date();
      const startDate = formatLocalDateKey(new Date(now.getFullYear(), now.getMonth(), 1));
      const endDate = formatLocalDateKey(new Date(now.getFullYear(), now.getMonth() + 1, 0));
      const res = await api.get(`/invoices/report?startDate=${startDate}&endDate=${endDate}`);
      setMonthlyRevenue(res.data?.totalRevenue || 0);
    } catch (err) {
      console.error(err);
      setMonthlyRevenue(0);
      if (!shouldSuppressDashboardError(err)) showToast("Failed to load revenue summary", "error");
    }
  };

  useEffect(() => {
    fetchPatients();
    fetchTrash();
    fetchAppointmentsToday();
    fetchWaitingSummary();
    fetchMonthlyRevenue();
  }, []);

  useEffect(() => {
    if (location.state?.newPatient) {
      setPatients((prev) => [location.state.newPatient, ...prev]);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    const today = formatLocalDateKey();
    if (today !== currentDay) setCurrentDay(today);
  }, [currentDay]);

  useEffect(() => {
    setPatientsToday(patients.filter((p) => formatLocalDateKey(p.createdAt) === currentDay));
  }, [patients, currentDay]);

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
    setSortConfig({ key, direction });
  };

  const sortedPatients = sortConfig.key
    ? [...patients].sort((a, b) => {
        if (!a[sortConfig.key]) return 1;
        if (!b[sortConfig.key]) return -1;
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === "asc" ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      })
    : [...patients];

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const matchesSearch = (patient) => {
    if (!normalizedSearchQuery) return true;
    return [patient?.name, patient?.cardNumber].filter(Boolean).map(v => String(v).toLowerCase()).some(v => v.includes(normalizedSearchQuery));
  };

  const activeList = showTrash ? trash.filter(matchesSearch) : sortedPatients.filter(p => p && p.name).filter(matchesSearch);
  const totalPages = Math.max(1, Math.ceil(activeList.length / PATIENTS_PER_PAGE));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const pageStartIndex = (currentPageSafe - 1) * PATIENTS_PER_PAGE;
  const paginatedPatients = activeList.slice(pageStartIndex, pageStartIndex + PATIENTS_PER_PAGE);

  useEffect(() => setCurrentPage(1), [searchQuery, showTrash, sortConfig]);
  useEffect(() => { if (currentPage > totalPages) setCurrentPage(totalPages); }, [currentPage, totalPages]);

  const handleDelete = async (patientId) => {
    if (!window.confirm("Move this patient to Trash?")) return;
    try {
      const res = await api.delete(`/patients/${patientId}`);
      if (res.status === 200) {
        setPatients((prev) => prev.filter((patient) => getEntityId(patient) !== patientId));
        fetchTrash();
        showToast(res.data.message || "Patient moved to Trash");
      } else showToast("Failed to delete patient", "error");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete patient", "error");
    }
  };

  const handleRestore = async (patientId) => {
    try {
      const res = await api.put(`/patients/${patientId}/restore`);
      if (res.status === 200) {
        fetchPatients();
        fetchTrash();
        showToast("Patient restored successfully");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to restore patient", "error");
    }
  };

  const handlePermanentDelete = async (patientId) => {
    if (!window.confirm("Permanently delete this patient?")) return;
    try {
      const res = await api.delete(`/patients/${patientId}/permanent`);
      if (res.status === 200) {
        fetchTrash();
        showToast("Patient permanently deleted");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to permanently delete patient", "error");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="p-6 md:p-8 space-y-8 h-full">
      {toast && <Toast message={toast.message} type={toast.type} duration={3000} onClose={() => setToast(null)} />}

      {!showTrash && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-500">Patients Today</p>
                  <h3 className="text-3xl font-bold text-slate-900 mt-2">{patientsToday.length}</h3>
                </div>
                <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600">
                  <Users size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-500">Appointments</p>
                  <h3 className="text-3xl font-bold text-slate-900 mt-2">{appointmentsToday}</h3>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                  <Calendar size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
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
              <div className="flex justify-between items-start">
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
        <div className="p-4 border-b border-surface-200 bg-surface-50 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <h2 className="text-lg font-semibold text-slate-800">
            {showTrash ? "Deleted Records" : "Patient Directory"}
          </h2>
          <div className="w-full sm:w-72">
            <Input 
              placeholder="Search by name or card..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={Search}
              className="bg-white h-10"
            />
          </div>
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
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                    {searchQuery ? "No patients match your search." : (showTrash ? "Trash is empty." : "No patients found.")}
                  </td>
                </tr>
              ) : (
                paginatedPatients.map((p) => {
                  const patientId = getEntityId(p);
                  const isToday = patientsToday.some((todayP) => getEntityId(todayP) === patientId);
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
            Showing <span className="font-medium text-slate-900">{activeList.length > 0 ? pageStartIndex + 1 : 0}</span> to <span className="font-medium text-slate-900">{Math.min(pageStartIndex + PATIENTS_PER_PAGE, activeList.length)}</span> of <span className="font-medium text-slate-900">{activeList.length}</span> results
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPageSafe <= 1}>
              Previous
            </Button>
            <div className="flex items-center px-4 text-sm font-medium text-slate-700">
              {currentPageSafe} / {totalPages}
            </div>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPageSafe >= totalPages}>
              Next
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
