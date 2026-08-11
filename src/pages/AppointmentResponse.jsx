import React, { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle2, CalendarClock, RefreshCcw, AlertCircle, MessageSquareMore } from "lucide-react";
import api from "../services/api";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

const actionMeta = {
  confirm: {
    title: "Confirm appointment",
    button: "Confirm Appointment",
    icon: CheckCircle2,
  },
  reschedule: {
    title: "Request reschedule",
    button: "Send Reschedule Request",
    icon: RefreshCcw,
  },
};

export default function AppointmentResponse() {
  const [params] = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [form, setForm] = useState({
    preferredDate: "",
    preferredTime: "",
    preferredNote: "",
  });

  const token = params.get("token") || "";
  const action = params.get("action") || "confirm";
  const isRescheduleAction = action === "reschedule";
  const isRescheduleReady = Boolean(
    form.preferredDate.trim() && form.preferredTime.trim(),
  );
  const meta = useMemo(() => actionMeta[action] || actionMeta.confirm, [action]);
  const Icon = meta.icon;

  const submitResponse = async () => {
    try {
      setSubmitting(true);
      const payload = {
        token,
        action,
      };

      if (isRescheduleAction) {
        payload.preferredDate = form.preferredDate;
        payload.preferredTime = form.preferredTime;
        payload.preferredNote = form.preferredNote;
      }

      const response = await api.post("/appointments/respond", payload);
      setResult({
        type: "success",
        message:
          response.data?.message ||
          (action === "confirm"
            ? "Appointment confirmed successfully."
            : "Reschedule request received successfully."),
      });
    } catch (error) {
      setResult({
        type: "error",
        message:
          error.response?.data?.message ||
          "We could not process this appointment response.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-surface-50 px-4 py-10">
      <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-2xl bg-primary-50 p-3 text-primary-600">
            <CalendarClock size={24} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-600">
              CareChrome
            </p>
            <h1 className="text-2xl font-bold text-slate-900">{meta.title}</h1>
          </div>
        </div>

        {result ? (
          <div
            className={`rounded-2xl border p-5 ${
              result.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-rose-200 bg-rose-50 text-rose-900"
            }`}
          >
            <div className="flex items-start gap-3">
              {result.type === "success" ? (
                <CheckCircle2 size={22} className="mt-0.5 shrink-0" />
              ) : (
                <AlertCircle size={22} className="mt-0.5 shrink-0" />
              )}
              <div>
                <p className="font-semibold">{result.message}</p>
                <p className="mt-2 text-sm opacity-80">
                  You can close this page now.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <p className="mb-6 text-sm leading-relaxed text-slate-600">
              {isRescheduleAction
                ? "Tell the clinic which date and time would suit you better. The clinic staff will review your request before changing the appointment."
                : "Use the button below to tell the clinic that you will attend this appointment."}
            </p>

            {!token ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
                This response link is missing its token and cannot be used.
              </div>
            ) : isRescheduleAction ? (
              <div className="space-y-5">
                <Input
                  type="date"
                  name="preferredDate"
                  label="Preferred new date"
                  value={form.preferredDate}
                  onChange={handleFormChange}
                  min={new Date().toISOString().split("T")[0]}
                  required
                />
                <Input
                  type="time"
                  name="preferredTime"
                  label="Preferred new time"
                  value={form.preferredTime}
                  onChange={handleFormChange}
                  required
                />
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Note for the clinic (optional)
                  </label>
                  <div className="relative">
                    <MessageSquareMore
                      size={18}
                      className="pointer-events-none absolute left-3 top-3.5 text-slate-400"
                    />
                    <textarea
                      name="preferredNote"
                      value={form.preferredNote}
                      onChange={handleFormChange}
                      rows="4"
                      maxLength={500}
                      className="w-full rounded-xl border border-surface-200 bg-white py-3 pl-10 pr-3 text-sm text-slate-800 shadow-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Anything the clinic should know about your preferred slot?"
                    />
                  </div>
                </div>
                <Button
                  onClick={submitResponse}
                  isLoading={submitting}
                  disabled={!isRescheduleReady}
                  className="w-full"
                >
                  <Icon size={18} className="mr-2" />
                  {meta.button}
                </Button>
              </div>
            ) : (
              <Button
                onClick={submitResponse}
                isLoading={submitting}
                className="w-full"
              >
                <Icon size={18} className="mr-2" />
                {meta.button}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
