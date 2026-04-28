import React, { useState, useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { Calendar as CalendarIcon, Clock, User, FileText, CheckCircle, Trash2, Edit2, Plus, AlertCircle, Bell } from "lucide-react";
import api from "../../services/api";
import {
  getDashboardSummary,
  patchDashboardSummaryCache,
} from "../../services/dashboardSummary";
import Toast from "../Toast";
import AppointmentForm from "./AppointmentForm";
import { getEntityId } from "../../utils/entityId";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { Card, CardContent } from "../ui/Card";
import ConfirmModal from "../ui/ConfirmModal";
import usePersistentState from "../../hooks/usePersistentState";

export default function AppointmentSchedule({ patientId = null }) {
  const storedUser = JSON.parse((localStorage.getItem("user") || sessionStorage.getItem("user"))) || {};
  const canCompleteAppointment = storedUser.role === "admin" || storedUser.role === "doctor" || storedUser.role === "nurse";
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uiState, setUiState, clearUiState] = usePersistentState(
    `primuxcare:draft:appointment-schedule:${patientId || "general"}`,
    { showForm: false, editingAppointmentId: null, selectedDate: "" },
  );
  const { showForm, editingAppointmentId, selectedDate } = uiState;
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [confirmConfig, setConfirmConfig] = useState(null);

  const isTodayAppointment = useCallback((value) => {
    if (!value) return false;
    const date = new Date(value);
    const now = new Date();
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    );
  }, []);

  const isSameCalendarDay = useCallback((left, right) => {
    if (!left || !right) return false;
    const leftDate = new Date(left);
    const rightDate = new Date(right);
    return (
      leftDate.getFullYear() === rightDate.getFullYear() &&
      leftDate.getMonth() === rightDate.getMonth() &&
      leftDate.getDate() === rightDate.getDate()
    );
  }, []);

  const refreshDashboardSummary = useCallback(() => {
    getDashboardSummary({ forceRefresh: true }).catch(() => {
      // sidebar and dashboard already got the optimistic update
    });
  }, []);

  const adjustAppointmentSummary = useCallback(({ scheduledDelta = 0, todayDelta = 0 }) => {
    if (!scheduledDelta && !todayDelta) return;

    patchDashboardSummaryCache((current) => {
      if (!current) return current;

      const nextScheduled = Math.max(
        0,
        (current.appointments?.scheduled || 0) + scheduledDelta,
      );
      const nextToday = Math.max(
        0,
        (current.appointments?.today || 0) + todayDelta,
      );

      return {
        ...current,
        appointments: {
          ...current.appointments,
          scheduled: nextScheduled,
          today: nextToday,
        },
      };
    });
  }, []);

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
      setToast({ show: true, message: error.response?.data?.message || "Failed to fetch appointments", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [patientId, selectedDate]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  useEffect(() => {
    if (!editingAppointmentId) {
      setEditingAppointment(null);
      return;
    }

    const matchedAppointment = appointments.find(
      (item) => getEntityId(item) === editingAppointmentId,
    );
    setEditingAppointment(matchedAppointment || null);
  }, [appointments, editingAppointmentId]);

  const executeDelete = useCallback(async (id) => {
    try {
      const deletedAppointment = appointments.find(
        (appointment) => getEntityId(appointment) === id,
      );
      await api.delete(`/appointments/${id}`);
      setAppointments((current) =>
        current.filter((appointment) => getEntityId(appointment) !== id),
      );
      adjustAppointmentSummary({
        scheduledDelta: -1,
        todayDelta: deletedAppointment && isTodayAppointment(deletedAppointment.appointmentDate) ? -1 : 0,
      });
      refreshDashboardSummary();
      setToast({ show: true, message: "Appointment cancelled", type: "success" });
    } catch (error) {
      setToast({ show: true, message: error.response?.data?.message || "Failed to cancel", type: "error" });
    }
  }, [adjustAppointmentSummary, appointments, isTodayAppointment, refreshDashboardSummary]);

  const handleDelete = (id) => {
    setConfirmConfig({
      title: "Cancel Appointment",
      message: "Are you sure you want to cancel this appointment?",
      confirmText: "Cancel Appointment",
      danger: true,
      onConfirm: () => executeDelete(id)
    });
  };

  const handleComplete = useCallback(async (id) => {
    try {
      const completedAppointment = appointments.find(
        (appointment) => getEntityId(appointment) === id,
      );
      await api.put(`/appointments/${id}`, { status: "completed" });
      setAppointments((current) => current.filter((appointment) => getEntityId(appointment) !== id));
      adjustAppointmentSummary({
        scheduledDelta: -1,
        todayDelta: completedAppointment && isTodayAppointment(completedAppointment.appointmentDate) ? -1 : 0,
      });
      refreshDashboardSummary();
      setToast({ show: true, message: "Appointment marked as completed", type: "success" });
    } catch (error) {
      setToast({ show: true, message: error.response?.data?.message || "Failed to complete appointment", type: "error" });
    }
  }, [adjustAppointmentSummary, appointments, isTodayAppointment, refreshDashboardSummary]);

  const handleFormSuccess = (savedAppointment, previousAppointment = null) => {
    const wasToday = previousAppointment && isTodayAppointment(previousAppointment.appointmentDate);
    const isToday = savedAppointment && isTodayAppointment(savedAppointment.appointmentDate);
    const scheduledDelta = previousAppointment ? 0 : 1;
    const todayDelta = previousAppointment
      ? (isToday ? 1 : 0) - (wasToday ? 1 : 0)
      : isToday
        ? 1
        : 0;

    if (savedAppointment) {
      setAppointments((current) => {
        const currentWithoutSaved = current.filter(
          (appointment) => getEntityId(appointment) !== getEntityId(savedAppointment),
        );

        if (selectedDate && !isSameCalendarDay(savedAppointment.appointmentDate, selectedDate)) {
          return currentWithoutSaved;
        }

        return [savedAppointment, ...currentWithoutSaved];
      });
    }

    adjustAppointmentSummary({ scheduledDelta, todayDelta });
    refreshDashboardSummary();
    clearUiState();
    setEditingAppointment(null);
    fetchAppointments();
    setToast({ show: true, message: editingAppointment ? "Appointment updated" : "Appointment scheduled", type: "success" });
  };

  const getStatusStyle = (status) => {
    const styles = {
      scheduled: "bg-blue-100 text-blue-800 border-blue-200",
      arrived: "bg-indigo-100 text-indigo-800 border-indigo-200",
      completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
      no_show: "bg-amber-100 text-amber-800 border-amber-200",
    };
    return styles[status] || "bg-slate-100 text-slate-800 border-slate-200";
  };

  const getTypeLabel = (type) => {
    const labels = {
      checkup: "General Check-up", cleaning: "Cleaning", filling: "Filling",
      extraction: "Extraction", root_canal: "Root Canal", other: "Other",
    };
    return labels[type] || type;
  };

  const canModifyAppointment = (status) => !["arrived", "completed", "cancelled", "no_show"].includes(status);

  if (showForm) {
    return <AppointmentForm patientId={patientId} appointment={editingAppointment} draftStorageKey={`primuxcare:draft:appointment-form:${editingAppointmentId || patientId || "new"}`} onSuccess={handleFormSuccess} onCancel={() => { clearUiState(); setEditingAppointment(null); }} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 bg-white p-6 rounded-2xl shadow-sm border border-surface-200">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">Appointments</h2>
          <p className="text-sm text-slate-500 max-w-xl">
             Upcoming schedule. Appointments disappear from this view once the patient is marked as completed or checked in to the waiting room.
          </p>
        </div>
        <Button onClick={() => { setEditingAppointment(null); setUiState((current) => ({ ...current, showForm: true, editingAppointmentId: null })); }} className="w-full sm:w-auto shadow-md">
          <Plus size={18} className="mr-2" /> Schedule Visit
        </Button>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <div className="w-full sm:w-72">
          <Input type="date" label="Filter by Date" icon={CalendarIcon} value={selectedDate} onChange={(e) => setUiState((current) => ({ ...current, selectedDate: e.target.value }))} className="bg-white" />
        </div>
        {selectedDate && (
          <Button variant="ghost" size="sm" onClick={() => setUiState((current) => ({ ...current, selectedDate: "" }))} className="mt-6 text-slate-500 hover:bg-slate-200">
             Clear Date Filter
          </Button>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-500 flex flex-col items-center">
           <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent mb-4"></div>
           Loading scheduled appointments...
        </div>
      ) : appointments.length === 0 ? (
        <Card className="bg-slate-50/50 border-dashed border-2">
          <CardContent className="py-16 text-center text-slate-500 flex flex-col items-center gap-3">
            <CalendarIcon size={48} className="text-slate-300" />
            <p className="text-lg font-medium text-slate-700">No appointments found</p>
            <p className="text-sm max-w-sm mx-auto">There are no upcoming visits scheduled matching this criteria.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence>
            {appointments.map((apt) => (
              <div key={getEntityId(apt)}>
                <Card className="h-full hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className={`absolute top-0 left-0 w-1.5 h-full ${getStatusStyle(apt.status).split(' ')[0]}`} />
                  <CardContent className="p-5 pl-7 flex flex-col h-full gap-4">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg leading-tight line-clamp-1">
                          {apt.patientId?.name || "Unknown Patient"}
                        </h3>
                        <p className="text-xs font-semibold text-primary-600 mt-1 uppercase tracking-wider">{getTypeLabel(apt.appointmentType)}</p>
                        {/* Reminder badge removed */}
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full border uppercase tracking-wider ${getStatusStyle(apt.status)}`}>
                        {apt.status}
                      </span>
                    </div>

                    <div className="space-y-2 mt-auto">
                      <div className="flex items-center text-sm text-slate-600 font-medium">
                        <CalendarIcon size={16} className="mr-3 text-slate-400 shrink-0" />
                        {new Date(apt.appointmentDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </div>
                      <div className="flex items-center text-sm text-slate-600">
                        <Clock size={16} className="mr-3 text-slate-400 shrink-0" />
                        {apt.timeSlot} <span className="text-slate-400 ml-1">({apt.duration} min)</span>
                      </div>
                      {apt.notes && (
                        <div className="flex items-start text-sm text-slate-600 mt-2">
                          <FileText size={16} className="mr-3 text-slate-400 mt-0.5 shrink-0" />
                          <p className="line-clamp-2 text-xs italic bg-slate-50 p-2 rounded-lg w-full border border-slate-100">{apt.notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Touch devices & Hover state actions */}
                    <div className="flex items-center gap-2 pt-4 mt-2 border-t border-slate-100 lg:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      {canModifyAppointment(apt.status) ? (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => { setEditingAppointment(apt); setUiState((current) => ({ ...current, showForm: true, editingAppointmentId: getEntityId(apt) })); }} className="flex-1 text-slate-600 hover:text-blue-600 px-0">
                            <Edit2 size={16} />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(getEntityId(apt))} className="flex-1 text-slate-600 hover:text-red-600 hover:bg-red-50 px-0">
                            <Trash2 size={16} />
                          </Button>
                          {canCompleteAppointment && (
                            <Button variant="ghost" size="sm" onClick={() => handleComplete(getEntityId(apt))} className="flex-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-700 px-0">
                              <CheckCircle size={16} className="mr-1 sm:mr-0 xl:mr-1" /> <span className="hidden xl:inline">Complete</span>
                            </Button>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center text-xs text-slate-400 italic py-1.5 w-full justify-center">
                           <AlertCircle size={14} className="mr-1.5" /> Closed schedule
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} duration={3000} />}
      <ConfirmModal 
        isOpen={!!confirmConfig} 
        onClose={() => setConfirmConfig(null)} 
        {...confirmConfig} 
      />
    </div>
  );
}
