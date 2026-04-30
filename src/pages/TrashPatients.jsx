// src/pages/TrashPatients.jsx
import React, { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "../services/api";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ui/ConfirmModal";
import { getEntityId } from "../utils/entityId";

export default function TrashPatients() {
  const [patients, setPatients] = useState([]);
  const [selected, setSelected] = useState(new Set()); // Use Set for persistent selection
  const [toast, setToast] = useState({ message: "", type: "", show: false });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [confirmConfig, setConfirmConfig] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(10);
  const paginatedPatients = () => patients;

  // =========================
  // FETCH TRASHED PATIENTS
  // =========================
  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/patients/trash/all", {
        params: {
          page: currentPage,
          limit: perPage,
          search: search.trim() || undefined,
        },
      });
      const pageData = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
          ? res.data
          : [];
      setPatients(pageData);
      setTotalPages(Number(res.data?.totalPages) || 1);
      setTotalResults(Number(res.data?.total) || pageData.length);
    } catch (err) {
      console.error(err);
      showToast("Failed to fetch patients", "error");
      setPatients([]);
      setTotalPages(1);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, search]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // =========================
  // TOAST
  // =========================
  const showToast = (message, type = "success") => {
    setToast({ message, type, show: true });
    setTimeout(() => setToast({ message: "", type, show: false }), 3000);
  };

  // =========================
  // SELECTION
  // =========================
  const toggleSelect = (id) => {
    const newSet = new Set(selected);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelected(newSet);
  };

  const toggleSelectAll = () => {
    const currentIds = patients.map((patient) => getEntityId(patient));
    const allSelected = currentIds.every((id) => selected.has(id));
    const newSet = new Set(selected);
    currentIds.forEach((id) => (allSelected ? newSet.delete(id) : newSet.add(id)));
    setSelected(newSet);
  };

  // =========================
  // BULK ACTIONS
  // =========================
  const handleRestore = async () => {
    if (!selected.size) return showToast("No patients selected", "error");
    setLoading(true);
    try {
      await api.put("/patients/trash/restore", { ids: Array.from(selected) });
      showToast("Selected patients restored");
      setSelected(new Set());
      fetchPatients();
    } catch (err) {
      console.error(err);
      showToast("Failed to restore patients", "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePermanentDelete = async () => {
    if (!selected.size) return showToast("No patients selected", "error");
    if (false) return;
    setLoading(true);
    try {
      await api.delete("/patients/trash/permanent", { data: { ids: Array.from(selected) } });
      showToast("Selected patients permanently deleted");
      setSelected(new Set());
      fetchPatients();
    } catch (err) {
      console.error(err);
      showToast("Failed to delete patients", "error");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // PAGINATION
  // =========================
  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="p-4">
      <h1 className="text-xl font-bold mb-4">Trash Patients</h1>

      {toast.show && <Toast message={toast.message} type={toast.type} />}

      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:gap-2">
        <input
          type="text"
          placeholder="Search by name or age..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-2 py-1 border rounded mb-2 sm:mb-0 flex-1"
        />
        <button
          className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
          disabled={!selected.size || loading}
          onClick={handleRestore}
        >
          Restore
        </button>
        <button
          className="px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50"
          disabled={!selected.size || loading}
          onClick={handlePermanentDelete}
        >
          Delete Permanently
        </button>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2 text-center">
              <input
                type="checkbox"
                checked={
                  patients.length > 0 &&
                  patients.every((patient) =>
                    selected.has(getEntityId(patient)),
                  )
                }
                onChange={toggleSelectAll}
              />
            </th>
            <th className="p-2">Name</th>
            <th className="p-2">Age</th>
            <th className="p-2">Deleted At</th>
          </tr>
        </thead>
        <tbody>
          {patients.length === 0 ? (
            <tr>
              <td colSpan="4" className="text-center p-4">
                No trashed patients
              </td>
            </tr>
          ) : (
            patients.map((p) => (
              <tr key={getEntityId(p)} className="border-b">
                <td className="p-2 text-center">
                  <input
                    type="checkbox"
                    checked={selected.has(getEntityId(p))}
                    onChange={() => toggleSelect(getEntityId(p))}
                  />
                </td>
                <td className="p-2">{p.name}</td>
                <td className="p-2">{p.age}</td>
                <td className="p-2">{new Date(p.updatedAt).toLocaleString()}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          <button
            className="px-3 py-1 border rounded"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              className={`px-3 py-1 border rounded ${
                currentPage === i + 1 ? "bg-gray-300" : ""
              }`}
              onClick={() => goToPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          <button
            className="px-3 py-1 border rounded"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
      <div className="mt-3 text-center text-sm text-slate-500">
        Showing {patients.length} of {totalResults} trashed patients
      </div>
    </motion.div>
  );
}
