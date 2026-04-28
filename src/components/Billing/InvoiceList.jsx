import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { CreditCard, FileText, DollarSign, AlertCircle, Plus, Search, ChevronDown, CheckCircle, Printer, ArrowLeft, Activity } from "lucide-react";
import api from "../../services/api";
import Toast from "../Toast";
import InvoiceForm from "./InvoiceForm";
import { getEntityId } from "../../utils/entityId";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { Card, CardContent } from "../ui/Card";
import usePersistentState from "../../hooks/usePersistentState";
import { resolveAssetUrl } from "../../utils/assetUrl";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 2 }).format(Number(value) || 0);

const getStatusColor = (status) => {
  const colors = { draft: "bg-slate-100 text-slate-700", issued: "bg-blue-100 text-blue-700", paid: "bg-emerald-100 text-emerald-700", overdue: "bg-rose-100 text-rose-700", cancelled: "bg-zinc-200 text-zinc-700" };
  return colors[status] || "bg-slate-100 text-slate-700";
};

function StatCard({ label, value, tone, icon: Icon }) {
  const tones = {
    blue: "bg-blue-600 text-white shadow-blue-500/20",
    emerald: "bg-emerald-600 text-white shadow-emerald-500/20",
    amber: "bg-amber-500 text-white shadow-amber-500/20",
    rose: "bg-rose-600 text-white shadow-rose-500/20",
    slate: "bg-slate-800 text-white shadow-slate-800/20",
  };

  return (
    <Card className="border-0 shadow-md relative overflow-hidden group">
      <div className={`absolute inset-0 opacity-90 ${tones[tone] || tones.slate}`} />
      <div className="absolute -right-4 -top-4 opacity-20 transform group-hover:scale-110 transition-transform duration-500">
        <Icon size={100} className="text-white" />
      </div>
      <CardContent className="p-5 relative z-10 text-white flex flex-col justify-between h-full min-h-[140px]">
        <p className="text-xs font-semibold uppercase tracking-widest opacity-80">{label}</p>
        <p className="mt-4 text-3xl font-bold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}

function SummaryRow({ label, value, strong = false }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className={strong ? "font-bold text-slate-900" : "font-medium text-slate-600"}>{label}</span>
      <span className={strong ? "text-xl font-bold text-primary-600" : "font-semibold text-slate-900"}>{value}</span>
    </div>
  );
}

function InvoiceViewer({ invoice, onClose }) {
  const storedUser = JSON.parse((localStorage.getItem("user") || sessionStorage.getItem("user")) || "null");
  const clinic = storedUser?.clinic || {};
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const handleRecordPayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) return setToast({ show: true, message: "Enter valid payment amount", type: "error" });
    setLoading(true);
    try {
      await api.put(`/invoices/${getEntityId(invoice)}/payment`, { amountPaid: parseFloat(paymentAmount), paymentMethod, notes: paymentNotes });
      setToast({ show: true, message: "Payment recorded", type: "success" });
      setTimeout(() => { onClose(); }, 1200);
    } catch (error) { setToast({ show: true, message: error.response?.data?.message || "Failed to record payment", type: "error" }); } finally { setLoading(false); }
  };

  return (
    <div className="mx-auto max-w-5xl rounded-2xl bg-white shadow-xl overflow-hidden mb-8 border border-slate-200">
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
         <button onClick={onClose} className="flex items-center text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"><ArrowLeft size={16} className="mr-2" /> Back to Billing</button>
         <button onClick={() => window.print()} className="flex items-center text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"><Printer size={16} className="mr-2" /> Print</button>
      </div>

      <div className="p-8">
        <div className="flex flex-col md:flex-row justify-between gap-8 mb-10">
          <div>
            {clinic.logoUrl && (
              <img src={resolveAssetUrl(clinic.logoUrl)} alt="Clinic Logo" className="h-16 w-auto object-contain mb-6 print:h-12" />
            )}
            <div className="bg-primary-50 text-primary-700 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-widest w-fit mb-4 mix-blend-multiply" style={clinic.brandColor ? { backgroundColor: `${clinic.brandColor}20`, color: clinic.brandColor } : {}}>Invoice</div>
            <h2 className="text-4xl font-bold text-slate-900 tracking-tight">{invoice.invoiceNumber}</h2>
            <div className="mt-4 space-y-1 text-sm text-slate-600">
              <p>Generated: <span className="font-semibold text-slate-900">{new Date(invoice.invoiceDate).toLocaleDateString()}</span></p>
              {invoice.dueDate && <p>Due: <span className="font-semibold text-slate-900">{new Date(invoice.dueDate).toLocaleDateString()}</span></p>}
            </div>
          </div>
          <div className="bg-slate-900 rounded-2xl p-6 text-white min-w-[300px]" style={clinic.brandColor ? { backgroundColor: clinic.brandColor } : {}}>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Billed To</p>
            <p className="text-2xl font-bold mb-1">{invoice.patientId?.name || "Unknown patient"}</p>
            <p className="text-sm text-slate-300 font-mono mb-2">{invoice.patientId?.phone || "No phone"}</p>
            <p className="text-sm text-slate-300 opacity-80">{invoice.patientId?.address || "No address"}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-8">
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center"><FileText size={18} className="mr-2" style={{ color: clinic.brandColor || 'currentColor' }} /> Items & Charges</h3>
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr><th className="px-4 py-3 text-left font-semibold text-slate-700">Description</th><th className="px-4 py-3 text-right font-semibold text-slate-700">Qty</th><th className="px-4 py-3 text-right font-semibold text-slate-700">Unit Price</th><th className="px-4 py-3 text-right font-semibold text-slate-700">Amount</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(invoice.items || []).map((item, index) => (
                    <tr key={`${getEntityId(invoice)}-${index}`}>
                      <td className="px-4 py-4"><p className="font-medium text-slate-900">{item.description}</p><p className="text-xs text-slate-500 capitalize mt-0.5">{item.category}</p></td>
                      <td className="px-4 py-4 text-right text-slate-600">{item.quantity}</td>
                      <td className="px-4 py-4 text-right text-slate-600">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-4 py-4 text-right font-semibold text-slate-900">{formatCurrency(item.totalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl bg-slate-50 p-6 border border-slate-200">
              <SummaryRow label="Subtotal" value={formatCurrency(invoice.subtotal)} />
              <SummaryRow label={`Tax (${invoice.taxPercentage || 0}%)`} value={formatCurrency(invoice.tax)} />
              <SummaryRow label="Discount" value={formatCurrency(invoice.discount)} />
              <div className="my-4 border-t border-slate-200 border-dashed" />
              <SummaryRow label="Total Billed" value={formatCurrency(invoice.total)} />
              <SummaryRow label="Amount Paid" value={formatCurrency(invoice.amountPaid)} />
              <div className="mt-6 pt-4 border-t-2 border-slate-200">
                <SummaryRow label="Amount Due" value={formatCurrency(invoice.balance)} strong />
              </div>
            </div>

            <div className={`rounded-2xl p-6 border flex items-center justify-between ${invoice.status === 'paid' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-white border-slate-200'}`}>
               <div>
                  <p className="text-xs font-semibold uppercase tracking-widest opacity-60 mb-1">Status</p>
                  <p className="text-2xl font-bold uppercase">{invoice.status}</p>
               </div>
               {invoice.status === 'paid' && <CheckCircle size={40} className="opacity-50" />}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr] gap-8 mt-8 pt-8 border-t border-slate-200">
          <div className="space-y-4">
             <h3 className="text-lg font-bold text-slate-900 flex items-center"><CreditCard size={18} className="mr-2" style={{ color: clinic.brandColor || 'currentColor' }} /> Payment History</h3>
             {(invoice.payments || []).length === 0 ? (
               <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500 bg-slate-50/50">No payments verified yet.</div>
             ) : (
               <div className="space-y-3">
                 {(invoice.payments || []).slice().reverse().map((payment) => (
                   <div key={payment.id} className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm flex items-center justify-between">
                     <div>
                       <p className="font-bold text-slate-900 text-lg mb-0.5">{formatCurrency(payment.amount)}</p>
                       <p className="text-xs text-slate-500 flex items-center"><span className="uppercase tracking-wider font-semibold mr-2">{String(payment.paymentMethod).replace("_", " ")}</span> {new Date(payment.receivedAt).toLocaleString()}</p>
                       {payment.notes && <p className="text-sm italic text-slate-600 mt-2 bg-slate-50 p-2 rounded">{payment.notes}</p>}
                     </div>
                     <CheckCircle size={24} className="text-emerald-500 shrink-0 opacity-50" />
                   </div>
                 ))}
               </div>
             )}
          </div>

          {["issued", "overdue"].includes(invoice.status) && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6 h-fit">
              <h3 className="text-lg font-bold text-emerald-900 mb-4">Record New Payment</h3>
              <div className="space-y-4">
                <Input label="Amount (NGN)" type="number" step="0.01" min="0" max={invoice.balance} value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} icon={DollarSign} className="bg-white" />
                <div className="space-y-1.5"><label className="text-sm font-semibold text-slate-700">Method</label><div className="relative"><select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 bg-white text-sm focus:ring-2 focus:ring-primary-500 shadow-sm appearance-none h-[46px]"><option value="cash">Cash</option><option value="card">Card / POS</option><option value="bank_transfer">Bank Transfer</option><option value="check">Check</option></select></div></div>
                <div className="space-y-1.5"><label className="text-sm font-semibold text-slate-700">Notes (optional)</label><textarea value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} rows="2" className="w-full rounded-xl border border-slate-200 p-3 bg-white text-sm focus:ring-2 focus:ring-primary-500 shadow-sm resize-none" placeholder="Reference ID..." /></div>
                <div className="pt-2"> 
                   <p className="text-sm text-slate-600 mb-3 bg-white p-3 rounded-lg border border-emerald-100 flex justify-between">New Balance: <span className="font-bold text-emerald-700">{formatCurrency(Math.max(0, Number(invoice.balance || 0) - Number(paymentAmount || 0)))}</span></p>
                   <Button onClick={handleRecordPayment} isLoading={loading} className="w-full shadow-md bg-emerald-600 hover:bg-emerald-700">Record Payment</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {toast.show && <Toast message={toast.message} type={toast.type} duration={3000} onClose={() => setToast({ ...toast, show: false })} />}
    </div>
  );
}

export default function InvoiceList({ patientId = null }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uiState, setUiState, clearUiState] = usePersistentState(
    `primuxcare:draft:invoice-list:${patientId || "general"}`,
    {
      showForm: false,
      filterStatus: "all",
      searchQuery: "",
      selectedPatientId: patientId || "",
    },
  );
  const { showForm, filterStatus, searchQuery, selectedPatientId } = uiState;
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [report, setReport] = useState(null);

  const fetchInvoices = useCallback(async () => {
    try { setLoading(true); const params = new URLSearchParams(); if (patientId) params.append("patientId", patientId); const response = await api.get(`/invoices?${params}`); setInvoices(response.data || []); } catch (error) { setToast({ show: true, message: error.response?.data?.message || "Failed to fetch invoices", type: "error" }); } finally { setLoading(false); }
  }, [patientId]);

  const fetchReport = useCallback(async () => { try { const response = await api.get("/invoices/report"); setReport(response.data); } catch (error) { console.error(error); } }, []);

  useEffect(() => { fetchInvoices(); fetchReport(); }, [fetchInvoices, fetchReport]);

  const handleFormSuccess = () => { clearUiState(); setViewingInvoice(null); fetchInvoices(); fetchReport(); };
  const handleIssueInvoice = async (id) => {
    try { await api.put(`/invoices/${id}/issue`); setToast({ show: true, message: "Invoice issued", type: "success" }); fetchInvoices(); fetchReport(); } catch (error) { setToast({ show: true, message: error.response?.data?.message || "Failed to issue", type: "error" }); }
  };

  const patientSummaries = useMemo(() => {
    const summaryMap = new Map();
    invoices.forEach((invoice) => {
      const currentPatientId = getEntityId(invoice.patientId);
      if (!currentPatientId) return;
      const summary = summaryMap.get(currentPatientId) || { patient: invoice.patientId, outstanding: 0, unpaidInvoices: 0, lastVisit: null, totalBilled: 0 };
      summary.outstanding += Number(invoice.balance) || 0;
      summary.totalBilled += Number(invoice.total) || 0;
      if (Number(invoice.balance) > 0 && invoice.status !== "cancelled") summary.unpaidInvoices += 1;
      const invoiceDate = invoice.invoiceDate ? new Date(invoice.invoiceDate) : null;
      if (invoiceDate && (!summary.lastVisit || invoiceDate > summary.lastVisit)) summary.lastVisit = invoiceDate;
      summaryMap.set(currentPatientId, summary);
    });
    return Array.from(summaryMap.values()).sort((a, b) => b.outstanding - a.outstanding);
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    const text = searchQuery.trim().toLowerCase();
    return invoices.filter((invoice) => {
      if (filterStatus !== "all" && invoice.status !== filterStatus) return false;
      if (selectedPatientId && getEntityId(invoice.patientId) !== selectedPatientId) return false;
      if (!text) return true;
      const haystack = [invoice.invoiceNumber, invoice.patientId?.name, invoice.patientId?.phone, ...(invoice.items || []).map((item) => item.description)].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(text);
    });
  }, [filterStatus, invoices, searchQuery, selectedPatientId]);

  const selectedPatientSummary = useMemo(() => {
    if (!selectedPatientId) return null;
    return patientSummaries.find((summary) => getEntityId(summary.patient) === selectedPatientId) || null;
  }, [patientSummaries, selectedPatientId]);

  const receptionistHighlights = useMemo(() => {
    const outstandingInvoices = invoices.filter((inv) => Number(inv.balance) > 0 && inv.status !== "cancelled");
    const dueToday = outstandingInvoices.filter((inv) => inv.dueDate && inv.dueDate.slice(0, 10) === new Date().toISOString().slice(0, 10));
    return { outstandingPatients: patientSummaries.filter((s) => s.outstanding > 0).length, dueToday: dueToday.length, drafts: invoices.filter((i) => i.status === "draft").length };
  }, [invoices, patientSummaries]);

  if (showForm) return <InvoiceForm patientId={selectedPatientId || patientId} draftStorageKey={`primuxcare:draft:invoice-form:${selectedPatientId || patientId || "new"}`} onSuccess={handleFormSuccess} onCancel={() => clearUiState()} />;
  if (viewingInvoice) return <InvoiceViewer invoice={viewingInvoice} onClose={() => { setViewingInvoice(null); fetchInvoices(); fetchReport(); }} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-surface-200">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">Billing & Collections</h2>
          <p className="text-sm text-slate-500 max-w-xl">Create invoices, manage outstanding balances, and record payments.</p>
        </div>
        <Button onClick={() => setUiState((current) => ({ ...current, showForm: true }))} className="w-full md:w-auto shadow-md"><Plus size={18} className="mr-2" /> New Invoice</Button>
      </div>

      {report && !patientId && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Invoices" value={report.totalInvoices} tone="blue" icon={FileText} />
          <StatCard label="Revenue Billed" value={formatCurrency(report.totalRevenue)} tone="slate" icon={DollarSign} />
          <StatCard label="Collections" value={formatCurrency(report.totalPaid)} tone="emerald" icon={CheckCircle} />
          <StatCard label="Outstanding" value={formatCurrency(report.totalOutstanding)} tone="amber" icon={AlertCircle} />
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-3/4 space-y-6">
          <Card className="border border-surface-200 shadow-sm">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="md:col-span-1">
                  <Input value={searchQuery} onChange={(e) => setUiState((current) => ({ ...current, searchQuery: e.target.value }))} placeholder="Search records..." icon={Search} className="bg-slate-50" />
                </div>
                <div>
                   <div className="relative">
                      <select value={filterStatus} onChange={(e) => setUiState((current) => ({ ...current, filterStatus: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-3 bg-slate-50 text-sm focus:ring-primary-500 shadow-sm appearance-none h-[46px]"><option value="all">All Statuses</option><option value="draft">Drafts</option><option value="issued">Issued</option><option value="paid">Paid</option><option value="overdue">Overdue</option><option value="cancelled">Cancelled</option></select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"><ChevronDown size={16} className="text-slate-400" /></div>
                   </div>
                </div>
                <div>
                   <div className="relative">
                      <select value={selectedPatientId} onChange={(e) => setUiState((current) => ({ ...current, selectedPatientId: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-3 bg-slate-50 text-sm focus:ring-primary-500 shadow-sm appearance-none h-[46px]"><option value="">All Patients</option>{patientSummaries.map((summary) => (<option key={getEntityId(summary.patient)} value={getEntityId(summary.patient)}>{summary.patient?.name || "Unknown patient"}</option>))}</select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"><ChevronDown size={16} className="text-slate-400" /></div>
                   </div>
                </div>
              </div>

              {selectedPatientSummary?.patient && selectedPatientSummary.patient.name && (
                <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50/50 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div>
                    <h3 className="text-lg font-bold text-blue-900">{selectedPatientSummary.patient.name}</h3>
                    <p className="text-sm text-blue-700 mt-1">{[selectedPatientSummary.patient.phone, selectedPatientSummary.patient.email].filter(Boolean).join(" | ")}</p>
                  </div>
                  <div className="flex flex-wrap gap-4 w-full md:w-auto">
                    <div className="bg-white px-4 py-2 rounded-lg border border-blue-100 shadow-sm flex-1 md:flex-none">
                       <p className="text-xs text-slate-500 uppercase font-semibold">Total Due</p>
                       <p className="text-lg font-bold text-rose-600">{formatCurrency(selectedPatientSummary.outstanding)}</p>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-lg border border-blue-100 shadow-sm flex-1 md:flex-none">
                       <p className="text-xs text-slate-500 uppercase font-semibold">Unpaid Bills</p>
                       <p className="text-lg font-bold text-blue-900">{selectedPatientSummary.unpaidInvoices}</p>
                    </div>
                  </div>
                </div>
              )}

              {loading ? (
                <div className="py-20 text-center flex flex-col items-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent mb-4" /><p className="text-slate-500">Loading billing records...</p></div>
              ) : filteredInvoices.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center text-slate-500 flex flex-col items-center">
                  <FileText size={48} className="text-slate-300 mb-4" />
                  <p className="text-lg font-medium text-slate-700">No invoices found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredInvoices.map((invoice) => (
                    <div key={getEntityId(invoice)} className="group rounded-2xl border border-slate-200 bg-white p-5 hover:border-primary-300 hover:shadow-md transition-all flex flex-col xl:flex-row gap-5 xl:items-center justify-between">
                       <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                             <h4 className="font-bold text-slate-900 text-lg">{invoice.invoiceNumber}</h4>
                             <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${getStatusColor(invoice.status)}`}>{invoice.status}</span>
                          </div>
                          <p className="text-sm font-medium text-slate-700 mb-1">{invoice.patientId?.name || "Unknown patient"}</p>
                          <div className="text-xs text-slate-500 flex flex-wrap gap-x-3 gap-y-1">
                             <span>Issued: {new Date(invoice.invoiceDate).toLocaleDateString()}</span>
                             {invoice.dueDate && <span>Due: {new Date(invoice.dueDate).toLocaleDateString()}</span>}
                          </div>
                       </div>

                       <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 xl:w-auto xl:min-w-[300px]">
                          <div><p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total</p><p className="font-semibold text-slate-900">{formatCurrency(invoice.total)}</p></div>
                          <div><p className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Paid</p><p className="font-semibold text-emerald-700">{formatCurrency(invoice.amountPaid)}</p></div>
                          <div><p className="text-[10px] uppercase font-bold text-rose-500 tracking-wider">Balance</p><p className="font-semibold text-rose-600">{formatCurrency(invoice.balance)}</p></div>
                       </div>

                       <div className="flex flex-col gap-2 pt-4 border-t border-slate-100 xl:w-auto xl:pt-0 xl:border-t-0 shrink-0 items-end justify-center xl:mr-4">
                          {invoice.status === "draft" && <Button variant="outline" onClick={() => handleIssueInvoice(getEntityId(invoice))} className="!w-[80px] !text-[11px] !h-7 !px-1 !py-0 !min-h-0 rounded-lg">Issue</Button>}
                          <Button onClick={() => setViewingInvoice(invoice)} className="shadow flex items-center justify-center !w-[80px] !text-[11px] !h-7 !px-1 !py-0 !min-h-0 rounded-lg">Open Bill</Button>
                       </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="w-full lg:w-1/4 space-y-6">
          <Card className="border border-slate-200 bg-white overflow-hidden shadow-sm">
             <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-6 flex items-center text-slate-900"><Activity size={18} className="mr-2 text-primary-500" /> Focus Areas</h3>
                <div className="space-y-4">
                   <div className="bg-rose-50 rounded-xl p-4 border border-rose-100">
                      <p className="text-rose-600 font-semibold text-sm uppercase tracking-wider">Due Today</p>
                      <p className="text-3xl font-bold mt-1 text-slate-900">{receptionistHighlights.dueToday}</p>
                   </div>
                   <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <p className="text-slate-600 font-semibold text-sm uppercase tracking-wider">Draft Bills</p>
                      <p className="text-3xl font-bold mt-1 text-slate-900">{receptionistHighlights.drafts}</p>
                   </div>
                   <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                      <p className="text-amber-700 font-semibold text-sm uppercase tracking-wider">Unpaid Patients</p>
                      <p className="text-3xl font-bold mt-1 text-slate-900">{receptionistHighlights.outstandingPatients}</p>
                   </div>
                </div>
             </CardContent>
          </Card>
        </div>
      </div>
      {toast.show && <Toast message={toast.message} type={toast.type} duration={3000} onClose={() => setToast({ ...toast, show: false })} />}
    </div>
  );
}
