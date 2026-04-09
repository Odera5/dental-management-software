import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api, { logoutCurrentUser } from "../services/api";
import Toast from "../components/Toast";
import { getEntityId } from "../utils/entityId";

const formatLocalDateKey = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const storedUser = JSON.parse(localStorage.getItem("user")) || {};
  const user = {
    name: storedUser.name || storedUser.email || "User",
    email: storedUser.email || "",
    role: storedUser.role || "nurse",
    clinicName: storedUser.clinic?.name || "Clinic",
  };

  const [patients, setPatients] = useState([]);
  const [patientsToday, setPatientsToday] = useState([]);
  const [appointmentsToday, setAppointmentsToday] = useState(0);
  const [waitingSummary, setWaitingSummary] = useState({
    waiting: 0,
    called: 0,
    in_consultation: 0,
    completed: 0,
    total: 0,
  });
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [trash, setTrash] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [loading, setLoading] = useState(true);
  const [showTrash, setShowTrash] = useState(false);
  const [toast, setToast] = useState(null);
  const [currentDay, setCurrentDay] = useState(formatLocalDateKey());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [authChecked, setAuthChecked] = useState(false);

  const showToast = (message, type = "success") => setToast({ message, type });

  // Redirect if not logged in
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) navigate("/login");
    else setAuthChecked(true);
  }, [navigate]);

  // Fetch patients
  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await api.get("/patients");
      const activePatients = (res.data || []).filter((p) => p && !p.isDeleted);
      setPatients(
        activePatients.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
        ),
      );
    } catch (err) {
      console.error(err);
      showToast("Failed to load patients", "error");
    } finally {
      setLoading(false);
    }
  };

  // Fetch trash
  const fetchTrash = async () => {
    if (user.role !== "admin") return;
    try {
      const res = await api.get("/patients/trash/all");
      // Ensure name is always present
      setTrash(
        (res.data || []).map((p) => ({
          ...p,
          name: p.name || p.fullName || "Unknown",
        })),
      );
    } catch (err) {
      console.error(err);
      showToast("Failed to load trash", "error");
    }
  };

  const fetchAppointmentsToday = async () => {
    try {
      const today = formatLocalDateKey();
      const res = await api.get(
        `/appointments?startDate=${today}&endDate=${today}`,
      );
      setAppointmentsToday(res.data?.length || 0);
    } catch (err) {
      console.error(err);
      showToast("Failed to load today's appointments", "error");
    }
  };

  const fetchWaitingSummary = async () => {
    try {
      const res = await api.get("/waiting-room/summary");
      setWaitingSummary(
        res.data || {
          waiting: 0,
          called: 0,
          in_consultation: 0,
          completed: 0,
          total: 0,
        },
      );
    } catch (err) {
      console.error(err);
      showToast("Failed to load waiting room summary", "error");
    }
  };

  const fetchMonthlyRevenue = async () => {
    try {
      const now = new Date();
      const startDate = formatLocalDateKey(
        new Date(now.getFullYear(), now.getMonth(), 1),
      );
      const endDate = formatLocalDateKey(
        new Date(now.getFullYear(), now.getMonth() + 1, 0),
      );
      const res = await api.get(
        `/invoices/report?startDate=${startDate}&endDate=${endDate}`,
      );
      setMonthlyRevenue(res.data?.totalRevenue || 0);
    } catch (err) {
      console.error(err);
      showToast("Failed to load revenue summary", "error");
    }
  };

  useEffect(() => {
    if (!authChecked) return;
    fetchPatients();
    fetchTrash();
    fetchAppointmentsToday();
    fetchWaitingSummary();
    fetchMonthlyRevenue();
  }, [authChecked]);

  // Add new patient from navigation state
  useEffect(() => {
    if (location.state?.newPatient) {
      setPatients((prev) => [location.state.newPatient, ...prev]);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  // Reset current day if date changes
  useEffect(() => {
    const today = formatLocalDateKey();
    if (today !== currentDay) setCurrentDay(today);
  }, [currentDay]);

  // Patients registered today
  useEffect(() => {
    setPatientsToday(
      patients.filter((p) => formatLocalDateKey(p.createdAt) === currentDay),
    );
  }, [patients, currentDay]);

  const handleLogout = async () => {
    await logoutCurrentUser();
    navigate("/login");
  };

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc")
      direction = "desc";
    setSortConfig({ key, direction });
  };

  const sortedPatients = sortConfig.key
    ? [...patients].sort((a, b) => {
        if (!a[sortConfig.key]) return 1;
        if (!b[sortConfig.key]) return -1;
        if (a[sortConfig.key] < b[sortConfig.key])
          return sortConfig.direction === "asc" ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key])
          return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      })
    : [...patients];

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  const matchesPatientSearch = (patient) => {
    if (!normalizedSearchQuery) return true;

    const searchableValues = [patient?.name, patient?.cardNumber]
      .filter(Boolean)
      .map((value) => String(value).toLowerCase());

    return searchableValues.some((value) => value.includes(normalizedSearchQuery));
  };

  const filteredPatients = sortedPatients
    .filter((p) => p && p.name)
    .filter(matchesPatientSearch);

  const filteredTrash = trash
    .filter((p) => p && p.name)
    .filter(matchesPatientSearch);

  // Soft delete
  const handleDelete = async (patientId) => {
    if (!window.confirm("Move this patient to Trash?")) return;
    try {
      const res = await api.delete(`/patients/${patientId}`);
      if (res.status === 200) {
        // Remove from active patients
        setPatients((prev) =>
          prev.filter((patient) => getEntityId(patient) !== patientId),
        );
        // Refresh trash immediately from backend
        fetchTrash();
        showToast(res.data.message || "Patient moved to Trash");
      } else showToast("Failed to delete patient", "error");
    } catch (err) {
      console.error(err);
      showToast(
        err.response?.data?.message || "Failed to delete patient",
        "error",
      );
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
      console.error(err);
      showToast(
        err.response?.data?.message || "Failed to restore patient",
        "error",
      );
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
      console.error(err);
      showToast(
        err.response?.data?.message || "Failed to permanently delete patient",
        "error",
      );
    }
  };

  const handleViewRecords = (patientId) => navigate(`/patients/${patientId}/records`);

  const formattedTime = currentTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  const formattedDate = currentTime.toLocaleDateString();

  return (
    <div className="min-h-screen bg-gray-100 p-3 sm:p-4 lg:p-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={3000}
          onClose={() => setToast(null)}
        />
      )}

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
            BHF by PrimuxCare
          </p>
          <h1 className="text-xl font-bold sm:text-2xl">Welcome, {user.name}</h1>
          <p className="flex flex-wrap items-center gap-2 text-sm text-gray-600 sm:gap-4">
            Role: {user.role} <span className="text-gray-400">|</span>{" "}
            {formattedDate} {formattedTime}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {(user.role === "admin" ||
            user.role === "nurse" ||
            user.role === "doctor") && (
            <>
              {user.role === "admin" && (
                <button
                  onClick={() => navigate("/signup")}
                  className="rounded bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-700"
                >
                  Manage Staff
                </button>
              )}
              <button
                onClick={() => navigate("/register-patient")}
                className="rounded bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
              >
                Register Patient
              </button>
              <button
                onClick={() => navigate("/appointments")}
                className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
              >
                Appointments
              </button>
              <button
                onClick={() => navigate("/waiting-room")}
                className="rounded bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
              >
                Waiting Room
              </button>
              <button
                onClick={() => navigate("/billing")}
                className="rounded bg-orange-600 px-4 py-2 text-sm text-white hover:bg-orange-700"
              >
                Billing
              </button>
            </>
          )}
          <button
            onClick={handleLogout}
            className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Logout
          </button>
          {user.role === "admin" && (
            <button
              onClick={() => setShowTrash(!showTrash)}
              className="rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
            >
              {showTrash ? "Back to Patients" : "Trash"}
            </button>
          )}
        </div>
      </div>

      {!showTrash && (
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded bg-white p-4 text-center shadow">
            <h3 className="text-gray-500 text-sm">Patients Registered Today</h3>
            <p className="text-2xl font-bold">{patientsToday.length}</p>
          </div>
          <div className="rounded bg-white p-4 text-center shadow">
            <h3 className="text-gray-500 text-sm">Appointments Today</h3>
            <p className="text-2xl font-bold">{appointmentsToday}</p>
          </div>
          <div className="rounded bg-white p-4 text-center shadow">
            <h3 className="text-gray-500 text-sm">Waiting Patients</h3>
            <p className="text-2xl font-bold">{waitingSummary.waiting}</p>
          </div>
          <div className="rounded bg-white p-4 text-center shadow">
            <h3 className="text-gray-500 text-sm">Monthly Revenue</h3>
            <p className="text-2xl font-bold">
              NGN {monthlyRevenue.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      <input
        type="text"
        placeholder="Search patients by name or card number..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="mb-4 w-full rounded border px-3 py-2"
      />

      <div className="rounded bg-white p-4 shadow sm:p-6">
        <h2 className="text-xl font-semibold mb-4">
          {showTrash ? "Trash" : "Patients"}
        </h2>

        {loading ? (
          <p className="text-center text-gray-500">Loading patients...</p>
        ) : (showTrash ? filteredTrash : filteredPatients).length === 0 ? (
          <p className="text-gray-500">
            {showTrash ? "No trashed patients." : "No patients found."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[640px] w-full border border-gray-300">
              <thead className="bg-gray-200">
                <tr>
                  <th
                    onClick={() => requestSort("name")}
                    className="cursor-pointer border px-4 py-2"
                  >
                    Name
                  </th>
                  <th
                    onClick={() => requestSort("age")}
                    className="cursor-pointer border px-4 py-2"
                  >
                    Age
                  </th>
                  <th className="border px-4 py-2">Card Number</th>
                  <th className="border px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(showTrash ? filteredTrash : filteredPatients).map((p) => {
                  const patientId = getEntityId(p);
                  const isToday = patientsToday.some(
                    (todayPatient) => getEntityId(todayPatient) === patientId,
                  );
                  return (
                    <tr
                      key={patientId}
                      className={`text-center ${!showTrash && isToday ? "bg-green-100 font-semibold" : ""}`}
                    >
                      <td className="border px-4 py-2">{p.name}</td>
                      <td className="border px-4 py-2">{p.age}</td>
                      <td className="border px-4 py-2">{p.cardNumber || "--"}</td>
                      <td className="border px-4 py-2">
                        {!showTrash && (
                          <button
                            onClick={() => handleViewRecords(patientId)}
                            className="mr-2 rounded bg-blue-600 px-2 py-1 text-white"
                          >
                            View Records
                          </button>
                        )}
                        {showTrash ? (
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleRestore(patientId)}
                              className="rounded bg-green-600 px-2 py-1 text-white"
                            >
                              Restore
                            </button>
                            <button
                              onClick={() => handlePermanentDelete(patientId)}
                              className="rounded bg-red-700 px-2 py-1 text-white"
                            >
                              Delete Permanently
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleDelete(patientId)}
                            className="rounded bg-red-600 px-2 py-1 text-white"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
