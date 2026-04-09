import React, { useEffect, useState, useCallback } from "react";
import api from "../../services/api";
import Toast from "../Toast";
import { getEntityId } from "../../utils/entityId";

const STATUS_LABELS = {
  waiting: "Waiting",
  called: "Called",
  in_consultation: "In Consultation",
  completed: "Completed",
};

const NEXT_ACTION = {
  waiting: "called",
  called: "in_consultation",
  in_consultation: "completed",
};

const ACTION_LABEL = {
  waiting: "Call Patient",
  called: "Start Consultation",
  in_consultation: "Complete",
};

export default function WaitingRoomBoard() {
  const [entries, setEntries] = useState([]);
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPatient, setSelectedPatient] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const fetchPatients = useCallback(async () => {
    try {
      const response = await api.get("/patients");
      setPatients(response.data || []);
    } catch (error) {
      console.error("Failed to load patients:", error);
      setToast({
        show: true,
        message: "Failed to load patients",
        type: "error",
      });
    }
  }, []);

  const fetchQueue = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (searchQuery) params.append("search", searchQuery);
      const response = await api.get(`/waiting-room?${params}`);
      setEntries(response.data || []);
    } catch (error) {
      console.error("Failed to load waiting room:", error);
      setToast({
        show: true,
        message: "Failed to load waiting room",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    fetchPatients();
    fetchQueue();
    const interval = setInterval(fetchQueue, 8000);
    return () => clearInterval(interval);
  }, [fetchPatients, fetchQueue]);

  const showToast = (message, type = "success") =>
    setToast({ show: true, message, type });

  const handleAddToWaitingRoom = async () => {
    if (!selectedPatient) {
      showToast("Select a patient to add", "error");
      return;
    }

    try {
      await api.post("/waiting-room", {
        patientId: selectedPatient,
        notes,
      });
      setSelectedPatient("");
      setNotes("");
      showToast("Patient added to waiting room", "success");
      fetchQueue();
    } catch (error) {
      showToast(
        error.response?.data?.message || "Failed to add patient",
        "error",
      );
    }
  };

  const handleStatusUpdate = async (item) => {
    const nextStatus = NEXT_ACTION[item.status];
    if (!nextStatus) return;

    try {
      await api.put(`/waiting-room/${getEntityId(item)}`, { status: nextStatus });
      showToast(
        `${item.patientName || item.patientId?.name} moved to ${STATUS_LABELS[nextStatus]}`,
        "success",
      );
      fetchQueue();
    } catch (error) {
      showToast(
        error.response?.data?.message || "Failed to update status",
        "error",
      );
    }
  };

  const handleRemove = async (item) => {
    if (
      !window.confirm(
        `Remove ${item.patientName || item.patientId?.name} from the queue?`,
      )
    ) {
      return;
    }

    try {
      await api.delete(`/waiting-room/${getEntityId(item)}`);
      showToast("Patient removed from waiting list", "success");
      fetchQueue();
    } catch (error) {
      showToast(
        error.response?.data?.message || "Failed to remove patient",
        "error",
      );
    }
  };

  const sectionItems = (status) =>
    entries.filter((entry) => entry.status === status);

  const formatDate = (value) => {
    if (!value) return "--";
    return new Date(value).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Waiting Room</h2>
          <p className="text-gray-600">
            Live queue management for every patient in the clinic.
          </p>
        </div>
        <button
          onClick={fetchQueue}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full md:w-auto"
        >
          Refresh Queue
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded border border-blue-100">
          <p className="text-sm text-gray-600">Waiting</p>
          <p className="mt-2 text-3xl font-semibold">
            {sectionItems("waiting").length}
          </p>
        </div>
        <div className="bg-yellow-50 p-4 rounded border border-yellow-100">
          <p className="text-sm text-gray-600">Called</p>
          <p className="mt-2 text-3xl font-semibold">
            {sectionItems("called").length}
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded border border-green-100">
          <p className="text-sm text-gray-600">In Consultation</p>
          <p className="mt-2 text-3xl font-semibold">
            {sectionItems("in_consultation").length}
          </p>
        </div>
        <div className="bg-gray-50 p-4 rounded border border-gray-100">
          <p className="text-sm text-gray-600">Completed</p>
          <p className="mt-2 text-3xl font-semibold">
            {sectionItems("completed").length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-gray-50 p-4 rounded border border-gray-200">
          <label className="block text-sm font-semibold mb-2">
            Add to Waiting Room
          </label>
          <select
            value={selectedPatient}
            onChange={(e) => setSelectedPatient(e.target.value)}
            className="w-full border border-gray-300 rounded p-2 mb-3"
          >
            <option value="">Select existing patient</option>
            {patients.map((patient) => (
              <option key={getEntityId(patient)} value={getEntityId(patient)}>
                {[patient.name, patient.phone || "no phone"].join(" | ")}
              </option>
            ))}
          </select>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border border-gray-300 rounded p-2 mb-3"
            rows="3"
            placeholder="Optional notes for receptionist or dentist"
          />
          <button
            onClick={handleAddToWaitingRoom}
            className="w-full bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            Add Patient
          </button>
        </div>

        <div className="lg:col-span-2 bg-gray-50 p-4 rounded border border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div>
              <p className="text-sm text-gray-600">Filter</p>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded p-2"
              >
                <option value="all">All statuses</option>
                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patient"
              className="border border-gray-300 rounded p-2 w-full md:w-72"
            />
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Loading queue...
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No patients are queued right now.
            </div>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => (
                <div
                  key={getEntityId(entry)}
                  className="border border-gray-200 rounded-lg p-4 bg-white"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div>
                      <p className="font-semibold text-lg">
                        {entry.patientName || entry.patientId?.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {[
                          entry.patientId?.phone || "No phone",
                          entry.patientId?.email || "No email",
                        ].join(" | ")}
                      </p>
                      <p className="text-sm text-gray-600 mt-2">
                        {STATUS_LABELS[entry.status]}
                      </p>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <p>Arrived: {formatDate(entry.arrivalTime)}</p>
                      <p>Called: {formatDate(entry.calledAt)}</p>
                      <p>
                        Consultation: {formatDate(entry.consultationStartedAt)}
                      </p>
                    </div>
                  </div>

                  {entry.notes && (
                    <p className="mt-3 text-sm text-gray-700">
                      Notes: {entry.notes}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {NEXT_ACTION[entry.status] && (
                      <button
                        onClick={() => handleStatusUpdate(entry)}
                        className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700"
                      >
                        {ACTION_LABEL[entry.status]}
                      </button>
                    )}
                    <button
                      onClick={() => handleRemove(entry)}
                      className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </div>
  );
}
