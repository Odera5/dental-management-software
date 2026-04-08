import React, { useState, useEffect, useCallback } from "react";
import api from "../../services/api";
import Toast from "../Toast";
import AppointmentForm from "./AppointmentForm";

export default function AppointmentSchedule({ patientId = null }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [selectedDate, setSelectedDate] = useState("");

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (patientId) params.append("patientId", patientId);
      if (selectedDate) {
        params.append("startDate", selectedDate);
        params.append("endDate", selectedDate);
      }
      params.append("status", "scheduled");

      const response = await api.get(`/appointments?${params}`);
      setAppointments(response.data);
    } catch (error) {
      setToast({
        show: true,
        message:
          error.response?.data?.message || "Failed to fetch appointments",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [patientId, selectedDate]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleDelete = async (id) => {
    if (!window.confirm("Cancel this appointment?")) return;

    try {
      await api.delete(`/appointments/${id}`);
      setToast({
        show: true,
        message: "Appointment cancelled",
        type: "success",
      });
      fetchAppointments();
    } catch (error) {
      setToast({
        show: true,
        message: error.response?.data?.message || "Failed to cancel",
        type: "error",
      });
    }
  };

  const handleComplete = async (id) => {
    try {
      await api.put(`/appointments/${id}`, { status: "completed" });
      setAppointments((current) =>
        current.filter((appointment) => appointment._id !== id),
      );
      setToast({
        show: true,
        message: "Appointment marked as completed",
        type: "success",
      });
    } catch (error) {
      setToast({
        show: true,
        message: error.response?.data?.message || "Failed to complete appointment",
        type: "error",
      });
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingAppointment(null);
    fetchAppointments();
    setToast({
      show: true,
      message: editingAppointment
        ? "Appointment updated"
        : "Appointment created",
      type: "success",
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: "bg-blue-100 text-blue-800",
      arrived: "bg-indigo-100 text-indigo-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      no_show: "bg-yellow-100 text-yellow-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getTypeLabel = (type) => {
    const labels = {
      checkup: "Check-up",
      cleaning: "Cleaning",
      filling: "Filling",
      extraction: "Extraction",
      root_canal: "Root Canal",
      other: "Other",
    };
    return labels[type] || type;
  };

  const canModifyAppointment = (status) =>
    !["arrived", "completed", "cancelled", "no_show"].includes(status);

  if (showForm) {
    return (
      <AppointmentForm
        patientId={patientId}
        appointment={editingAppointment}
        onSuccess={handleFormSuccess}
        onCancel={() => {
          setShowForm(false);
          setEditingAppointment(null);
        }}
      />
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Appointments</h2>
          <p className="text-sm text-gray-600">
            Patients disappear from this list as soon as they are checked into the waiting room or marked completed.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingAppointment(null);
            setShowForm(true);
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Schedule Appointment
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-2">Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full border border-gray-300 rounded p-2"
          />
        </div>
      </div>

      {/* Appointments List */}
      {loading ? (
        <div className="text-center py-8">Loading appointments...</div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No appointments found
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <div
              key={appointment._id}
              className="border border-gray-300 rounded-lg p-4 hover:shadow-lg"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-lg">
                      {appointment.patientId?.name || "Unknown Patient"}
                    </h3>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded ${getStatusColor(appointment.status)}`}
                    >
                      {appointment.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-semibold">Date:</span>
                      <p>
                        {new Date(
                          appointment.appointmentDate,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="font-semibold">Time:</span>
                      <p>{appointment.timeSlot}</p>
                    </div>
                    <div>
                      <span className="font-semibold">Type:</span>
                      <p>{getTypeLabel(appointment.appointmentType)}</p>
                    </div>
                    <div>
                      <span className="font-semibold">Duration:</span>
                      <p>{appointment.duration} min</p>
                    </div>
                  </div>

                  {appointment.notes && (
                    <p className="text-sm text-gray-600 mt-2">
                      <span className="font-semibold">Notes:</span>{" "}
                      {appointment.notes}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  {canModifyAppointment(appointment.status) ? (
                    <>
                      <button
                        onClick={() => handleComplete(appointment._id)}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                      >
                        Mark Completed
                      </button>
                      <button
                        onClick={() => {
                          setEditingAppointment(appointment);
                          setShowForm(true);
                        }}
                        className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(appointment._id)}
                        className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <span className="text-sm text-gray-500">
                      Closed appointment
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
