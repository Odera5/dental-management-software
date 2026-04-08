import React, { useState, useEffect } from "react";
import api from "../../services/api";
import Toast from "../Toast";

export default function AppointmentForm({
  patientId = null,
  appointment = null,
  onSuccess,
  onCancel,
}) {
  const [formData, setFormData] = useState({
    patientId: patientId || "",
    appointmentDate: "",
    timeSlot: "",
    appointmentType: "checkup",
    duration: 30,
    notes: "",
    dentistId: "",
  });
  const [patientMode, setPatientMode] = useState(patientId ? "existing" : "existing");
  const [newPatient, setNewPatient] = useState({
    name: "",
    age: "",
    gender: "other",
    phone: "",
    email: "",
    address: "",
  });

  const [patients, setPatients] = useState([]);
  const [dentists, setDentists] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [slotLoading, setSlotLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  useEffect(() => {
    fetchPatients();
    fetchDentists();
  }, []);

  useEffect(() => {
    if (appointment) {
      setFormData({
        patientId: appointment.patientId._id,
        appointmentDate: appointment.appointmentDate.split("T")[0],
        timeSlot: appointment.timeSlot,
        appointmentType: appointment.appointmentType,
        duration: appointment.duration,
        notes: appointment.notes,
        dentistId: appointment.dentistId?._id || "",
      });
    }
  }, [appointment]);

  useEffect(() => {
    if (formData.appointmentDate) {
      fetchAvailableSlots();
    }
  }, [formData.appointmentDate, formData.duration]);

  const fetchPatients = async () => {
    try {
      const response = await api.get("/patients");
      setPatients(response.data);
    } catch (error) {
      console.error("Failed to fetch patients:", error);
    }
  };

  const fetchDentists = async () => {
    try {
      // Assuming you have a dentists endpoint or getting from users
      // For now, we'll skip this or you can add it later
      setDentists([]);
    } catch (error) {
      console.error("Failed to fetch dentists:", error);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      setSlotLoading(true);
      const response = await api.get(
        `/appointments/available-slots?date=${formData.appointmentDate}&duration=${formData.duration}`,
      );
      setAvailableSlots(response.data.availableSlots);
      setFormData((prev) => ({
        ...prev,
        timeSlot: response.data.availableSlots.includes(prev.timeSlot)
          ? prev.timeSlot
          : "",
      }));
    } catch (error) {
      console.error("Failed to fetch slots:", error);
      setAvailableSlots([]);
    } finally {
      setSlotLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNewPatientChange = (e) => {
    const { name, value } = e.target;
    setNewPatient((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let resolvedPatientId = formData.patientId;

      if (patientMode === "new") {
        if (!newPatient.name.trim() || !newPatient.age) {
          setToast({
            show: true,
            message: "New patient name and age are required",
            type: "error",
          });
          setLoading(false);
          return;
        }

        const patientResponse = await api.post("/patients", {
          name: newPatient.name,
          age: newPatient.age,
          gender: newPatient.gender,
          phone: newPatient.phone,
          email: newPatient.email,
          address: newPatient.address,
        });

        resolvedPatientId = patientResponse.data._id;
      }

      const payload = {
        ...formData,
        patientId: resolvedPatientId,
      };

      if (appointment) {
        await api.put(`/appointments/${appointment._id}`, payload);
      } else {
        await api.post("/appointments", payload);
      }

      setToast({
        show: true,
        message: appointment ? "Appointment updated" : "Appointment scheduled",
        type: "success",
      });

      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (error) {
      setToast({
        show: true,
        message: error.response?.data?.message || "Failed to save appointment",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">
        {appointment ? "Edit Appointment" : "Schedule Appointment"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!patientId && (
          <div>
            <label className="block text-sm font-semibold mb-2">Patient Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setPatientMode("existing");
                  setFormData((prev) => ({ ...prev, patientId: prev.patientId || "" }));
                }}
                className={`px-3 py-2 rounded border ${
                  patientMode === "existing"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-300"
                }`}
              >
                Existing Patient
              </button>
              <button
                type="button"
                onClick={() => {
                  setPatientMode("new");
                  setFormData((prev) => ({ ...prev, patientId: "" }));
                }}
                className={`px-3 py-2 rounded border ${
                  patientMode === "new"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-300"
                }`}
              >
                New Patient
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {patientMode === "existing" || patientId ? (
            <div>
              <label className="block text-sm font-semibold mb-2">
                Patient *
              </label>
              <select
                name="patientId"
                value={formData.patientId}
                onChange={handleChange}
                required
                disabled={!!patientId}
                className="w-full border border-gray-300 rounded p-2"
              >
                <option value="">Select Patient</option>
                {patients.map((patient) => (
                  <option key={patient._id} value={patient._id}>
                    {patient.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-semibold mb-2">
                  New Patient Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={newPatient.name}
                  onChange={handleNewPatientChange}
                  required={patientMode === "new"}
                  className="w-full border border-gray-300 rounded p-2"
                  placeholder="Enter patient name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Age *
                </label>
                <input
                  type="number"
                  name="age"
                  value={newPatient.age}
                  onChange={handleNewPatientChange}
                  required={patientMode === "new"}
                  min="0"
                  className="w-full border border-gray-300 rounded p-2"
                  placeholder="Enter age"
                />
              </div>
            </>
          )}

          {/* Appointment Date */}
          <div>
            <label className="block text-sm font-semibold mb-2">Date *</label>
            <input
              type="date"
              name="appointmentDate"
              value={formData.appointmentDate}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded p-2"
            />
          </div>

          {/* Time Slot */}
          <div>
            <label className="block text-sm font-semibold mb-2">Time *</label>
            <select
              name="timeSlot"
              value={formData.timeSlot}
              onChange={handleChange}
              required
              disabled={!formData.appointmentDate || slotLoading || availableSlots.length === 0}
              className="w-full border border-gray-300 rounded p-2"
            >
              <option value="">
                {!formData.appointmentDate
                  ? "Select date first"
                  : slotLoading
                    ? "Loading available times..."
                    : availableSlots.length === 0
                      ? "No available times"
                      : "Select Time"}
              </option>
              {availableSlots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
            {formData.appointmentDate && !slotLoading && availableSlots.length === 0 && (
              <p className="mt-1 text-sm text-red-600">
                No free slots for this date. Try another day.
              </p>
            )}
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-semibold mb-2">Type</label>
            <select
              name="appointmentType"
              value={formData.appointmentType}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded p-2"
            >
              <option value="checkup">Check-up</option>
              <option value="cleaning">Cleaning</option>
              <option value="filling">Filling</option>
              <option value="extraction">Extraction</option>
              <option value="root_canal">Root Canal</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Duration (min)
            </label>
            <input
              type="number"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              min="15"
              step="15"
              className="w-full border border-gray-300 rounded p-2"
            />
          </div>

          {patientMode === "new" && !patientId && (
            <>
              <div>
                <label className="block text-sm font-semibold mb-2">Gender</label>
                <select
                  name="gender"
                  value={newPatient.gender}
                  onChange={handleNewPatientChange}
                  className="w-full border border-gray-300 rounded p-2"
                >
                  <option value="other">Other</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={newPatient.phone}
                  onChange={handleNewPatientChange}
                  className="w-full border border-gray-300 rounded p-2"
                  placeholder="Optional phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={newPatient.email}
                  onChange={handleNewPatientChange}
                  className="w-full border border-gray-300 rounded p-2"
                  placeholder="Optional email"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Address</label>
                <input
                  type="text"
                  name="address"
                  value={newPatient.address}
                  onChange={handleNewPatientChange}
                  className="w-full border border-gray-300 rounded p-2"
                  placeholder="Optional address"
                />
              </div>
            </>
          )}

          {/* Dentist */}
          <div>
            <label className="block text-sm font-semibold mb-2">Dentist</label>
            <select
              name="dentistId"
              value={formData.dentistId}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded p-2"
            >
              <option value="">Unassigned</option>
              {dentists.map((dentist) => (
                <option key={dentist._id} value={dentist._id}>
                  {dentist.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-semibold mb-2">Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="4"
            className="w-full border border-gray-300 rounded p-2"
            placeholder="Add any additional notes..."
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {loading
              ? "Saving..."
              : appointment
                ? "Update Appointment"
                : "Schedule Appointment"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </form>

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
