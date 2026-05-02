import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { User, Calendar, Clock, MapPin, Phone, Mail, Hash, UserPlus, Save, X, Activity, Bell, Lock, Crown } from "lucide-react";
import api from "../../services/api";
import Toast from "../Toast";
import { getEntityId } from "../../utils/entityId";
import Input from "../ui/Input";
import Button from "../ui/Button";
import { Card, CardContent } from "../ui/Card";
import usePersistentState from "../../hooks/usePersistentState";
import PatientPicker from "../ui/PatientPicker";
import { hasActiveProAccess } from "../../utils/clinicAccess";

export default function AppointmentForm({ patientId = null, appointment = null, onSuccess, onCancel, draftStorageKey = "primuxcare:draft:appointment-form:new" }) {
  const dentistAssignmentEnabled = false;
  const navigate = useNavigate();
  const storedUser = JSON.parse((localStorage.getItem("user") || sessionStorage.getItem("user"))) || {};
  const clinic = storedUser?.clinic || {};
  const hasProReminderAccess = hasActiveProAccess(clinic);
  const [formData, setFormData, clearFormDraft] = usePersistentState(
    `${draftStorageKey}:form`,
    appointment
      ? {
          patientId: getEntityId(appointment.patientId),
          appointmentDate: appointment.appointmentDate.split("T")[0],
          timeSlot: appointment.timeSlot,
          appointmentType: appointment.appointmentType,
          duration: appointment.duration,
          notes: appointment.notes || "",
          dentistId: getEntityId(appointment.dentistId),
          reminderEnabled: Boolean(appointment.reminderEnabled),
        }
      : {
          patientId: patientId || "", appointmentDate: "", timeSlot: "",
          appointmentType: "checkup", duration: 30, notes: "", dentistId: "", reminderEnabled: hasProReminderAccess,
        },
  );
  const [patientMode, setPatientMode, clearPatientModeDraft] = usePersistentState(
    `${draftStorageKey}:mode`,
    "existing",
  );
  const [newPatient, setNewPatient, clearNewPatientDraft] = usePersistentState(
    `${draftStorageKey}:patient`,
    { name: "", age: "", gender: "other", phone: "", email: "", address: "" },
  );
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [slotLoading, setSlotLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const fetchAvailableSlots = useCallback(async () => {
    try {
      setSlotLoading(true);
      const response = await api.get(`/appointments/available-slots?date=${formData.appointmentDate}&duration=${formData.duration}${appointment ? `&appointmentId=${getEntityId(appointment)}` : ""}`);
      setAvailableSlots(response.data.availableSlots);
      setFormData((prev) => ({ ...prev, timeSlot: response.data.availableSlots.includes(prev.timeSlot) ? prev.timeSlot : "" }));
    } catch (error) {
      console.error("Failed to fetch slots:", error);
      setAvailableSlots([]);
    } finally {
      setSlotLoading(false);
    }
  }, [appointment, formData.appointmentDate, formData.duration, setFormData]);

  useEffect(() => {
    if (formData.appointmentDate) fetchAvailableSlots();
  }, [fetchAvailableSlots, formData.appointmentDate]);

  useEffect(() => {
    if (!hasProReminderAccess && formData.reminderEnabled) {
      setFormData((prev) => ({ ...prev, reminderEnabled: false }));
    }
  }, [formData.reminderEnabled, hasProReminderAccess, setFormData]);

  const handleChange = (e) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const handleNewPatientChange = (e) => setNewPatient((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const formatSelectedDateLabel = (value) => {
    if (!value) return "selected date";

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
      return "selected date";
    }

    return parsedDate.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let resolvedPatientId = formData.patientId;
      if ((patientMode === "existing" || patientId) && !resolvedPatientId) {
        setToast({ show: true, message: "Please select a patient", type: "error" });
        setLoading(false);
        return;
      }

      if (patientMode === "new") {
        if (!newPatient.name.trim() || !newPatient.age) {
          setToast({ show: true, message: "New patient name and age are required", type: "error" });
          setLoading(false); return;
        }
        if (formData.reminderEnabled && !newPatient.email.trim()) {
          setToast({ show: true, message: "Patient email is required for automated reminders", type: "error" });
          setLoading(false); return;
        }
        const patientResponse = await api.post("/patients", newPatient);
        resolvedPatientId = getEntityId(patientResponse.data);
      }

      const payload = {
        ...formData,
        patientId: resolvedPatientId,
        dentistId: dentistAssignmentEnabled ? formData.dentistId : "",
        reminderEnabled: hasProReminderAccess ? Boolean(formData.reminderEnabled) : false,
      };
      
      let savedAppointment;
      if (appointment) savedAppointment = (await api.put(`/appointments/${getEntityId(appointment)}`, payload)).data;
      else savedAppointment = (await api.post("/appointments", payload)).data;

      clearFormDraft();
      clearPatientModeDraft();
      clearNewPatientDraft();
      setToast({ show: true, message: appointment ? "Appointment updated" : "Appointment scheduled", type: "success" });
      setTimeout(() => { onSuccess(savedAppointment, appointment || null); }, 1000);
    } catch (error) {
      setToast({ show: true, message: error.response?.data?.message || "Failed to save appointment", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-8">
      <Card className="border-0 shadow-lg bg-white overflow-hidden">
        <div className="bg-slate-900 px-8 py-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
             <Calendar size={150} />
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold tracking-tight mb-2">
              {appointment ? "Edit Appointment" : "Schedule Appointment"}
            </h2>
            <p className="text-slate-300 text-sm max-w-xl">
              {appointment ? "Update booking details below." : "Book a new timeslot for an existing or new patient."}
            </p>
          </div>
        </div>

        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {!patientId && (
              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-700">Patient Type</label>
                <div className="flex gap-3 bg-surface-50 p-2 rounded-2xl w-fit border border-surface-200">
                  <button type="button" onClick={() => { setPatientMode("existing"); setFormData(p => ({ ...p, patientId: p.patientId || "" })); }} className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${patientMode === "existing" ? "bg-white text-slate-800 shadow-sm border border-surface-200" : "text-slate-500 hover:text-slate-700 hover:bg-white/50"}`}>
                    Existing Patient
                  </button>
                  <button type="button" onClick={() => { setPatientMode("new"); setFormData(p => ({ ...p, patientId: "" })); }} className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${patientMode === "new" ? "bg-white text-slate-800 shadow-sm border border-surface-200" : "text-slate-500 hover:text-slate-700 hover:bg-white/50"}`}>
                    <UserPlus size={16} /> New Patient
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
              {patientMode === "existing" || patientId ? (
                <PatientPicker
                  label="Patient"
                  value={formData.patientId}
                  onChange={(nextPatientId) =>
                    setFormData((prev) => ({ ...prev, patientId: nextPatientId }))
                  }
                  disabled={!!patientId}
                  required
                  className="col-span-1 md:col-span-2"
                  initialOption={appointment?.patientId || null}
                />
              ) : (
                <>
                  <Input label="New Patient's Full Name *" name="name" icon={User} value={newPatient.name} onChange={handleNewPatientChange} required={patientMode === "new"} />
                  <Input label="Age *" name="age" type="number" icon={Calendar} value={newPatient.age} onChange={handleNewPatientChange} required={patientMode === "new"} min="0" />
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Gender</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Hash size={18} className="text-slate-400" /></div>
                      <select name="gender" value={newPatient.gender} onChange={handleNewPatientChange} className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-3 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none h-[46px] shadow-sm">
                        <option value="other">Other</option><option value="male">Male</option><option value="female">Female</option>
                      </select>
                    </div>
                  </div>
                  <Input label="Phone" name="phone" icon={Phone} value={newPatient.phone} onChange={handleNewPatientChange} />
                  <Input label="Email" name="email" type="email" icon={Mail} value={newPatient.email} onChange={handleNewPatientChange} />
                  <Input label="Address" name="address" icon={MapPin} value={newPatient.address} onChange={handleNewPatientChange} />
                </>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <Input label="Appointment Date *" name="appointmentDate" type="date" icon={Calendar} value={formData.appointmentDate} onChange={handleChange} required />
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Time Slot *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {slotLoading ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-400 border-t-transparent" /> : <Clock size={18} className="text-slate-400" />}
                  </div>
                  <select name="timeSlot" value={formData.timeSlot} onChange={handleChange} required disabled={!formData.appointmentDate || slotLoading || availableSlots.length === 0} className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-3 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none h-[46px] shadow-sm disabled:bg-slate-50">
                    <option value="">
                      {!formData.appointmentDate
                        ? "Select date first"
                        : slotLoading
                          ? "Loading..."
                          : availableSlots.length === 0
                            ? "No free times"
                            : `Time available for ${formatSelectedDateLabel(formData.appointmentDate)}`}
                    </option>
                    {availableSlots.map((slot) => (<option key={slot} value={slot}>{slot}</option>))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Type</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Activity size={18} className="text-slate-400" /></div>
                  <select name="appointmentType" value={formData.appointmentType} onChange={handleChange} className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-3 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none h-[46px] shadow-sm">
                    <option value="checkup">Check-up</option><option value="cleaning">Cleaning</option><option value="filling">Filling</option><option value="extraction">Extraction</option><option value="root_canal">Root Canal</option><option value="other">Other</option>
                  </select>
                </div>
              </div>

              <Input label="Duration (min) *" name="duration" type="number" icon={Clock} value={formData.duration} onChange={handleChange} min="15" step="15" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Condition Notes / Reason</label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} rows="3" className="w-full rounded-xl border border-slate-200 p-4 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm resize-none" placeholder="Provide any additional context for the appointment..." />
            </div>

            <div className={`rounded-2xl border p-5 ${hasProReminderAccess ? "border-emerald-200 bg-emerald-50/70" : "border-amber-200 bg-amber-50/80"}`}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className={`rounded-xl p-3 ${hasProReminderAccess ? "bg-white text-emerald-600 border border-emerald-200" : "bg-white text-amber-600 border border-amber-200"}`}>
                    {hasProReminderAccess ? <Bell size={18} /> : <Lock size={18} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      Automated Appointment Reminders
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {hasProReminderAccess
                        ? "Send automatic appointment reminders before the visit using the clinic's saved reminder schedule. Patients need a reachable email or phone on file."
                        : "This reminder workflow is available while your clinic has active Pro access through the 14-day trial or a paid Pro subscription."}
                    </p>
                  </div>
                </div>

                {hasProReminderAccess ? (
                  <label className="inline-flex items-center gap-3 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 border border-emerald-200 shadow-sm">
                    <input
                      type="checkbox"
                      name="reminderEnabled"
                      checked={Boolean(formData.reminderEnabled)}
                      onChange={(event) =>
                        setFormData((prev) => ({
                          ...prev,
                          reminderEnabled: event.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
                    Enable reminders
                  </label>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/upgrade")}
                    className="w-full sm:w-auto bg-white border-amber-200 text-amber-800 hover:bg-amber-100"
                  >
                    <Crown size={16} className="mr-2" /> Upgrade to Pro
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 pt-6 mt-6 border-t border-slate-100">
              <Button type="submit" size="lg" isLoading={loading} className="w-full sm:w-auto shadow-md">
                <Save size={18} className="mr-2" /> {appointment ? "Save Changes" : "Confirm Booking"}
              </Button>
              <Button type="button" variant="ghost" size="lg" onClick={onCancel} disabled={loading} className="w-full sm:w-auto">
                <X size={18} className="mr-2" /> Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      {toast.show && <Toast message={toast.message} type={toast.type} duration={3000} onClose={() => setToast({ ...toast, show: false })} />}
    </div>
  );
}
