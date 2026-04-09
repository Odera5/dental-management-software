import React, { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import Toast from "../Toast";
import InvoiceForm from "./InvoiceForm";
import { getEntityId } from "../../utils/entityId";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(Number(value) || 0);

const getStatusColor = (status) => {
  const colors = {
    draft: "bg-slate-100 text-slate-700",
    issued: "bg-blue-100 text-blue-700",
    paid: "bg-emerald-100 text-emerald-700",
    overdue: "bg-rose-100 text-rose-700",
    cancelled: "bg-zinc-200 text-zinc-700",
  };

  return colors[status] || "bg-slate-100 text-slate-700";
};

const getPatientLabel = (patient) =>
  [patient?.name || "Unknown patient", patient?.phone || "No phone"].join(" | ");

function StatCard({ label, value, tone }) {
  const tones = {
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
    slate: "border-slate-200 bg-slate-50 text-slate-700",
  };

  return (
    <div className={`rounded-xl border p-4 ${tones[tone] || tones.slate}`}>
      <p className="text-xs uppercase tracking-[0.25em]">{label}</p>
      <p className="mt-3 text-2xl font-bold">{value}</p>
    </div>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className="rounded-lg bg-white/80 p-3 ring-1 ring-gray-200">
      <p className="text-xs uppercase tracking-[0.2em] text-gray-500">{label}</p>
      <p className="mt-2 text-lg font-bold text-gray-900">{value}</p>
    </div>
  );
}

function MetricBlock({ label, value, accent = "text-gray-900" }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-gray-500">{label}</p>
      <p className={`mt-2 text-base font-bold ${accent}`}>{value}</p>
    </div>
  );
}

function SummaryRow({ label, value, strong = false }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className={strong ? "font-semibold text-slate-900" : "text-slate-600"}>{label}</span>
      <span className={strong ? "text-lg font-bold text-slate-900" : "font-semibold text-slate-900"}>
        {value}
      </span>
    </div>
  );
}

function InvoiceViewer({ invoice, onClose }) {
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const handleRecordPayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      setToast({
        show: true,
        message: "Enter valid payment amount",
        type: "error",
      });
      return;
    }

    setLoading(true);

    try {
      await api.put(`/invoices/${getEntityId(invoice)}/payment`, {
        amountPaid: parseFloat(paymentAmount),
        paymentMethod,
        notes: paymentNotes,
      });

      setToast({
        show: true,
        message: "Payment recorded successfully",
        type: "success",
      });

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (error) {
      setToast({
        show: true,
        message: error.response?.data?.message || "Failed to record payment",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl rounded-2xl bg-white p-6 shadow">
      <button
        onClick={onClose}
        className="mb-6 text-sm font-semibold text-blue-600 hover:text-blue-800"
      >
        &lt; Back to Billing Desk
      </button>

      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6">
        <div className="flex flex-col gap-6 border-b border-slate-200 pb-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-teal-700">
              Dental Clinic Invoice
            </p>
            <p className="mt-2 text-sm font-medium text-slate-500">
              BHF by PrimuxCare
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">{invoice.invoiceNumber}</h2>
            <p className="mt-2 text-sm text-slate-600">
              Generated on {new Date(invoice.invoiceDate).toLocaleDateString()}
            </p>
            {invoice.dueDate && (
              <p className="text-sm text-slate-600">
                Due date: {new Date(invoice.dueDate).toLocaleDateString()}
              </p>
            )}
          </div>
          <div className="rounded-xl bg-slate-900 p-4 text-white">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Patient</p>
            <p className="mt-2 text-xl font-bold">{invoice.patientId?.name || "Unknown patient"}</p>
            <p className="mt-1 text-sm text-slate-300">{invoice.patientId?.phone || "No phone"}</p>
            <p className="text-sm text-slate-300">{invoice.patientId?.address || "No address"}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
          <div>
            <h3 className="mb-3 text-lg font-bold text-slate-900">Treatment Charges</h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left">Description</th>
                    <th className="px-4 py-3 text-left">Category</th>
                    <th className="px-4 py-3 text-right">Qty</th>
                    <th className="px-4 py-3 text-right">Unit Price</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(invoice.items || []).map((item, index) => (
                    <tr key={`${getEntityId(invoice)}-${index}`} className="border-t border-slate-200">
                      <td className="px-4 py-3">{item.description}</td>
                      <td className="px-4 py-3 capitalize">{item.category || "service"}</td>
                      <td className="px-4 py-3 text-right">{item.quantity}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {formatCurrency(item.totalPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <SummaryRow label="Subtotal" value={formatCurrency(invoice.subtotal)} />
              <SummaryRow
                label={`Tax (${invoice.taxPercentage || 0}%)`}
                value={formatCurrency(invoice.tax)}
              />
              <SummaryRow label="Discount" value={formatCurrency(invoice.discount)} />
              <SummaryRow label="Paid" value={formatCurrency(invoice.amountPaid)} />
              <div className="mt-3 border-t border-slate-200 pt-3">
                <SummaryRow
                  label="Balance"
                  value={formatCurrency(invoice.balance)}
                  strong
                />
              </div>
            </div>

            <div className="rounded-xl bg-emerald-50 p-4 ring-1 ring-emerald-200">
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-700">Status</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{invoice.status.toUpperCase()}</p>
              <p className="mt-2 text-sm text-slate-600">
                Last payment method: {invoice.paymentMethod || "pending"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_1fr]">
        <div className="rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Payment History</h3>
            <span className="text-sm text-slate-500">
              {(invoice.payments || []).length} payment
              {(invoice.payments || []).length === 1 ? "" : "s"}
            </span>
          </div>
          {(invoice.payments || []).length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              No payments have been recorded for this invoice yet.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {(invoice.payments || [])
                .slice()
                .reverse()
                .map((payment) => (
                  <div
                    key={payment.id}
                    className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {formatCurrency(payment.amount)}
                        </p>
                        <p className="text-sm text-slate-500 capitalize">
                          {String(payment.paymentMethod || "cash").replace("_", " ")}
                        </p>
                      </div>
                      <p className="text-sm text-slate-500">
                        {new Date(payment.receivedAt).toLocaleString()}
                      </p>
                    </div>
                    {payment.notes && (
                      <p className="mt-2 text-sm text-slate-600">{payment.notes}</p>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>

        {["issued", "overdue"].includes(invoice.status) && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <h3 className="text-lg font-bold text-slate-900">Collect Payment</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={invoice.balance}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-3"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-3"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="check">Check</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Notes</label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  rows="3"
                  className="w-full rounded-lg border border-slate-300 p-3"
                  placeholder="Cash received by front desk, transfer reference, POS note..."
                />
              </div>
              <p className="text-sm text-slate-600">
                Remaining balance after this payment:{" "}
                <span className="font-semibold">
                  {formatCurrency(
                    Math.max(0, Number(invoice.balance || 0) - Number(paymentAmount || 0)),
                  )}
                </span>
              </p>
              <button
                onClick={handleRecordPayment}
                disabled={loading}
                className="w-full rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700 disabled:bg-gray-400"
              >
                {loading ? "Recording..." : "Record Payment"}
              </button>
            </div>
          </div>
        )}
      </div>

      {invoice.notes && (
        <div className="mt-6 rounded-xl bg-amber-50 p-4 ring-1 ring-amber-200">
          <p className="text-sm font-semibold text-amber-800">Billing Notes</p>
          <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{invoice.notes}</p>
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 rounded-lg bg-slate-600 px-4 py-3 font-semibold text-white hover:bg-slate-700"
        >
          Close
        </button>
        <button
          onClick={() => window.print()}
          className="flex-1 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
        >
          Print Invoice
        </button>
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

export default function InvoiceList({ patientId = null }) {
  const [invoices, setInvoices] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState(patientId || "");
  const [report, setReport] = useState(null);

  useEffect(() => {
    fetchInvoices();
    fetchReport();
    fetchPatients();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (patientId) params.append("patientId", patientId);

      const response = await api.get(`/invoices?${params}`);
      setInvoices(response.data || []);
    } catch (error) {
      setToast({
        show: true,
        message: error.response?.data?.message || "Failed to fetch invoices",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchReport = async () => {
    try {
      const response = await api.get("/invoices/report");
      setReport(response.data);
    } catch (error) {
      console.error("Failed to fetch report:", error);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await api.get("/patients");
      setPatients((response.data || []).filter((patient) => !patient.isDeleted));
    } catch (error) {
      console.error("Failed to fetch patients:", error);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setViewingInvoice(null);
    fetchInvoices();
    fetchReport();
  };

  const handleIssueInvoice = async (id) => {
    try {
      await api.put(`/invoices/${id}/issue`);
      setToast({
        show: true,
        message: "Invoice issued successfully",
        type: "success",
      });
      fetchInvoices();
      fetchReport();
    } catch (error) {
      setToast({
        show: true,
        message: error.response?.data?.message || "Failed to issue invoice",
        type: "error",
      });
    }
  };

  const patientSummaries = useMemo(() => {
    const summaryMap = new Map();

    invoices.forEach((invoice) => {
      const currentPatientId = getEntityId(invoice.patientId);
      if (!currentPatientId) return;

      const summary = summaryMap.get(currentPatientId) || {
        patient: invoice.patientId,
        outstanding: 0,
        unpaidInvoices: 0,
        lastVisit: null,
        totalBilled: 0,
      };

      summary.outstanding += Number(invoice.balance) || 0;
      summary.totalBilled += Number(invoice.total) || 0;
      if (Number(invoice.balance) > 0 && invoice.status !== "cancelled") {
        summary.unpaidInvoices += 1;
      }

      const invoiceDate = invoice.invoiceDate ? new Date(invoice.invoiceDate) : null;
      if (invoiceDate && (!summary.lastVisit || invoiceDate > summary.lastVisit)) {
        summary.lastVisit = invoiceDate;
      }

      summaryMap.set(currentPatientId, summary);
    });

    return Array.from(summaryMap.values()).sort(
      (a, b) => b.outstanding - a.outstanding,
    );
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    const text = searchQuery.trim().toLowerCase();

    return invoices.filter((invoice) => {
      if (filterStatus !== "all" && invoice.status !== filterStatus) {
        return false;
      }

      if (selectedPatientId && getEntityId(invoice.patientId) !== selectedPatientId) {
        return false;
      }

      if (!text) return true;

      const haystack = [
        invoice.invoiceNumber,
        invoice.patientId?.name,
        invoice.patientId?.phone,
        ...(invoice.items || []).map((item) => item.description),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(text);
    });
  }, [filterStatus, invoices, searchQuery, selectedPatientId]);

  const selectedPatientSummary = useMemo(() => {
    if (!selectedPatientId) return null;
    return (
      patientSummaries.find((summary) => getEntityId(summary.patient) === selectedPatientId) ||
      {
        patient: patients.find((patient) => getEntityId(patient) === selectedPatientId) || null,
        outstanding: 0,
        unpaidInvoices: 0,
        lastVisit: null,
        totalBilled: 0,
      }
    );
  }, [patientSummaries, patients, selectedPatientId]);

  const receptionistHighlights = useMemo(() => {
    const outstandingInvoices = invoices.filter(
      (invoice) => Number(invoice.balance) > 0 && invoice.status !== "cancelled",
    );
    const dueToday = outstandingInvoices.filter((invoice) => {
      if (!invoice.dueDate) return false;
      return invoice.dueDate.slice(0, 10) === new Date().toISOString().slice(0, 10);
    });

    return {
      outstandingPatients: patientSummaries.filter((summary) => summary.outstanding > 0)
        .length,
      dueToday: dueToday.length,
      drafts: invoices.filter((invoice) => invoice.status === "draft").length,
    };
  }, [invoices, patientSummaries]);

  if (showForm) {
    return (
      <InvoiceForm
        patientId={selectedPatientId || patientId}
        onSuccess={handleFormSuccess}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  if (viewingInvoice) {
    return (
      <InvoiceViewer
        invoice={viewingInvoice}
        onClose={() => {
          setViewingInvoice(null);
          fetchInvoices();
          fetchReport();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-teal-900 to-emerald-800 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-200">
              Dental Billing Desk
            </p>
            <p className="mt-2 text-sm font-medium text-emerald-100">
              BHF by PrimuxCare
            </p>
            <h2 className="mt-2 text-3xl font-bold">Collections and patient balances</h2>
            <p className="mt-2 max-w-2xl text-sm text-emerald-100">
              Search a patient, raise treatment charges quickly, and keep payment history in one place.
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="rounded-lg bg-white px-4 py-2 font-semibold text-slate-900 hover:bg-emerald-50"
          >
            New Dental Invoice
          </button>
        </div>
      </div>

      {report && !patientId && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <StatCard label="Invoices Issued" value={report.totalInvoices} tone="blue" />
          <StatCard
            label="Revenue Billed"
            value={formatCurrency(report.totalRevenue)}
            tone="emerald"
          />
          <StatCard
            label="Payments Collected"
            value={formatCurrency(report.totalPaid)}
            tone="amber"
          />
          <StatCard
            label="Outstanding"
            value={formatCurrency(report.totalOutstanding)}
            tone="rose"
          />
          <StatCard
            label="Patients Owing"
            value={receptionistHighlights.outstandingPatients}
            tone="slate"
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="rounded-xl bg-white p-6 shadow">
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Search patient, invoice, or procedure
              </label>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by patient name, phone, invoice number, or item"
                className="w-full rounded-lg border border-gray-300 p-3"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Invoice Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full rounded-lg border border-gray-300 p-3"
              >
                <option value="all">All statuses</option>
                <option value="draft">Draft</option>
                <option value="issued">Issued</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-[1.5fr_auto]">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Focus on patient
              </label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 p-3"
              >
                <option value="">All patients</option>
                {patients.map((patient) => (
                  <option key={getEntityId(patient)} value={getEntityId(patient)}>
                    {getPatientLabel(patient)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchQuery("");
                  setFilterStatus("all");
                  setSelectedPatientId(patientId || "");
                }}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Reset Filters
              </button>
            </div>
          </div>

          {selectedPatientSummary?.patient && (
            <div className="mb-6 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">
                    Patient Billing Snapshot
                  </p>
                  <h3 className="mt-2 text-xl font-bold text-gray-900">
                    {selectedPatientSummary.patient.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    {[selectedPatientSummary.patient.phone || "No phone", selectedPatientSummary.patient.email || "No email"].join(" | ")}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <MiniMetric
                    label="Outstanding"
                    value={formatCurrency(selectedPatientSummary.outstanding)}
                  />
                  <MiniMetric
                    label="Unpaid Invoices"
                    value={selectedPatientSummary.unpaidInvoices}
                  />
                  <MiniMetric
                    label="Total Billed"
                    value={formatCurrency(selectedPatientSummary.totalBilled)}
                  />
                  <MiniMetric
                    label="Last Invoice"
                    value={
                      selectedPatientSummary.lastVisit
                        ? selectedPatientSummary.lastVisit.toLocaleDateString()
                        : "None"
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="py-10 text-center text-gray-500">Loading invoices...</div>
          ) : filteredInvoices.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 py-10 text-center text-gray-500">
              No billing records matched this view.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredInvoices.map((invoice) => (
                <div
                  key={getEntityId(invoice)}
                  className="rounded-xl border border-gray-200 p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-gray-900">
                          {invoice.invoiceNumber}
                        </h3>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(invoice.status)}`}
                        >
                          {invoice.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">
                        {invoice.patientId?.name || "Unknown patient"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {[invoice.patientId?.phone || "No phone", new Date(invoice.invoiceDate).toLocaleDateString()].join(" | ")}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(invoice.items || []).slice(0, 3).map((item, index) => (
                          <span
                            key={`${getEntityId(invoice)}-${index}`}
                            className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700"
                          >
                            {item.description}
                          </span>
                        ))}
                        {invoice.items.length > 3 && (
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                            +{invoice.items.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid min-w-[280px] grid-cols-3 gap-3 rounded-xl bg-gray-50 p-4 text-sm">
                      <MetricBlock label="Total" value={formatCurrency(invoice.total)} />
                      <MetricBlock label="Paid" value={formatCurrency(invoice.amountPaid)} />
                      <MetricBlock
                        label="Balance"
                        value={formatCurrency(invoice.balance)}
                        accent={Number(invoice.balance) > 0 ? "text-rose-600" : "text-emerald-600"}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => setViewingInvoice(invoice)}
                      className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-900"
                    >
                      Open Bill
                    </button>

                    {invoice.status === "draft" && (
                      <button
                        onClick={() => handleIssueInvoice(getEntityId(invoice))}
                        className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                      >
                        Issue to Patient
                      </button>
                    )}

                    {["issued", "overdue"].includes(invoice.status) && (
                      <button
                        onClick={() => setViewingInvoice(invoice)}
                        className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                      >
                        Collect Payment
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-xl bg-white p-6 shadow">
            <h3 className="text-lg font-bold text-gray-900">Front Desk Focus</h3>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <MiniMetric label="Due Today" value={receptionistHighlights.dueToday} />
              <MiniMetric label="Draft Bills" value={receptionistHighlights.drafts} />
              <MiniMetric label="Unpaid Patients" value={receptionistHighlights.outstandingPatients} />
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Patients With Outstanding Balances</h3>
              <span className="text-sm text-gray-500">Top debtors</span>
            </div>
            <div className="mt-4 space-y-3">
              {patientSummaries
                .filter((summary) => summary.outstanding > 0)
                .slice(0, 6)
                .map((summary) => (
                  <button
                    key={getEntityId(summary.patient)}
                    onClick={() => setSelectedPatientId(getEntityId(summary.patient))}
                    className="flex w-full items-center justify-between rounded-lg border border-gray-200 p-3 text-left hover:border-emerald-300 hover:bg-emerald-50"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">{summary.patient?.name}</p>
                      <p className="text-sm text-gray-500">
                        {summary.unpaidInvoices} unpaid invoice
                        {summary.unpaidInvoices === 1 ? "" : "s"}
                      </p>
                    </div>
                    <p className="font-bold text-rose-600">
                      {formatCurrency(summary.outstanding)}
                    </p>
                  </button>
                ))}
              {patientSummaries.every((summary) => summary.outstanding <= 0) && (
                <p className="text-sm text-gray-500">No outstanding balances right now.</p>
              )}
            </div>
          </div>
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
