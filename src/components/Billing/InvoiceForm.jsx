import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, FileText, Calendar, CreditCard, Save, X, User } from "lucide-react";
import api from "../../services/api";
import Toast from "../Toast";
import { DEFAULT_PROCEDURE_PRESETS, formatNaira, normalizeProcedurePresets } from "../../constants/billing";
import { getEntityId } from "../../utils/entityId";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { Card, CardContent } from "../ui/Card";

export default function InvoiceForm({ patientId = null, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    patientId: patientId || "",
    items: [{ description: "", category: "service", quantity: 1, unitPrice: 0, totalPrice: 0 }],
    taxPercentage: 0, discount: 0, dueDate: "", notes: "",
  });

  const [patients, setPatients] = useState([]);
  const [procedurePresets, setProcedurePresets] = useState(DEFAULT_PROCEDURE_PRESETS);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  useEffect(() => { fetchPatients(); fetchClinicProfile(); }, []);

  const fetchPatients = async () => {
    try { const response = await api.get("/patients"); setPatients(response.data); } catch (error) { console.error(error); }
  };

  const fetchClinicProfile = async () => {
    try {
      const response = await api.get("/auth/clinic-profile");
      setProcedurePresets(normalizeProcedurePresets(response.data?.clinic?.procedurePresetPrices));
    } catch (error) { setProcedurePresets(DEFAULT_PROCEDURE_PRESETS); }
  };

  const handlePatientChange = (value) => setFormData((prev) => ({ ...prev, patientId: value }));
  const handleFormChange = (e) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    if (field === "quantity" || field === "unitPrice") newItems[index].totalPrice = newItems[index].quantity * newItems[index].unitPrice;
    setFormData((prev) => ({ ...prev, items: newItems }));
  };

  const handleAddItem = () => setFormData((prev) => ({ ...prev, items: [...prev.items, { description: "", category: "service", quantity: 1, unitPrice: 0, totalPrice: 0 }] }));
  const handleAddPreset = (preset) => setFormData((prev) => ({ ...prev, items: [...prev.items, { description: preset.description, category: preset.category, quantity: 1, unitPrice: preset.unitPrice, totalPrice: preset.unitPrice }] }));
  const handleRemoveItem = (index) => setFormData((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.items.length === 0 || formData.items.some((item) => !item.description || item.unitPrice <= 0)) {
      return setToast({ show: true, message: "Please fill in all item details and ensure prices are greater than 0", type: "error" });
    }
    setLoading(true);
    try {
      await api.post("/invoices", formData);
      setToast({ show: true, message: "Invoice created successfully", type: "success" });
      setTimeout(() => { onSuccess(); }, 1500);
    } catch (error) {
      setToast({ show: true, message: error.response?.data?.message || "Failed to create invoice", type: "error" });
    } finally { setLoading(false); }
  };

  const subtotal = formData.items.reduce((sum, item) => sum + item.totalPrice, 0);
  const tax = subtotal * (formData.taxPercentage / 100);
  const total = subtotal + tax - formData.discount;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto pb-8">
      <Card className="border-0 shadow-lg bg-white overflow-hidden">
        <div className="bg-slate-900 px-8 py-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-10 transform translate-x-1/4 -translate-y-1/4"><FileText size={150} /></div>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold tracking-tight mb-2">Create New Invoice</h2>
            <p className="text-slate-300 text-sm">Draft a new bill for treatments, procedures, or consultations.</p>
          </div>
        </div>

        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Patient *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User size={18} className="text-slate-400" /></div>
                  <select value={formData.patientId} onChange={(e) => handlePatientChange(e.target.value)} required disabled={!!patientId} className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-3 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none h-[46px] shadow-sm disabled:bg-slate-50 disabled:text-slate-500">
                    <option value="">Select Patient</option>
                    {patients.map((p) => (<option key={getEntityId(p)} value={getEntityId(p)}>{p.name}</option>))}
                  </select>
                </div>
              </div>
              <Input label="Due Date" name="dueDate" type="date" icon={Calendar} value={formData.dueDate} onChange={handleFormChange} />
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-slate-900">Treatment Items</h3>
                <Button type="button" variant="outline" size="sm" onClick={handleAddItem} className="bg-white"><Plus size={16} className="mr-1" /> Add Custom Item</Button>
              </div>

              <div className="mb-6 bg-blue-50/50 border border-blue-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-blue-800 uppercase tracking-wider mb-3">Quick Add Procedures</p>
                <div className="flex flex-wrap gap-2">
                  {procedurePresets.map((preset) => (
                    <button key={preset.description} type="button" onClick={() => handleAddPreset(preset)} className="rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 shadow-sm transition-colors flex items-center">
                      <Plus size={12} className="mr-1" /> {preset.description} ({formatNaira(preset.unitPrice)})
                    </button>
                  ))}
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold">Description</th>
                      <th className="text-left py-3 px-4 font-semibold w-32">Category</th>
                      <th className="text-center py-3 px-4 font-semibold w-24">Qty</th>
                      <th className="text-right py-3 px-4 font-semibold w-32">Price</th>
                      <th className="text-right py-3 px-4 font-semibold w-32">Total</th>
                      <th className="text-center py-3 px-4 font-semibold w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {formData.items.map((item, idx) => (
                      <tr key={idx} className="bg-white">
                        <td className="py-2 px-4"><input type="text" value={item.description} onChange={(e) => handleItemChange(idx, "description", e.target.value)} required placeholder="Item description" className="w-full border-0 focus:ring-0 p-0 text-sm" /></td>
                        <td className="py-2 px-4"><select value={item.category} onChange={(e) => handleItemChange(idx, "category", e.target.value)} className="w-full border-0 focus:ring-0 p-0 text-sm bg-transparent"><option value="service">Service</option><option value="procedure">Procedure</option><option value="medication">Medication</option><option value="lab">Lab</option><option value="other">Other</option></select></td>
                        <td className="py-2 px-4"><input type="number" value={item.quantity} onChange={(e) => handleItemChange(idx, "quantity", parseFloat(e.target.value))} min="1" className="w-full text-center border-0 focus:ring-0 p-0 text-sm" /></td>
                        <td className="py-2 px-4"><input type="number" value={item.unitPrice} onChange={(e) => handleItemChange(idx, "unitPrice", parseFloat(e.target.value))} step="0.01" min="0" className="w-full text-right border-0 focus:ring-0 p-0 text-sm" /></td>
                        <td className="py-2 px-4 text-right font-semibold text-slate-900">{formatNaira(item.totalPrice)}</td>
                        <td className="py-2 px-4 text-center">{formData.items.length > 1 && (<button type="button" onClick={() => handleRemoveItem(idx)} className="text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              <div className="space-y-4">
                 <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Billing Notes</label>
                  <textarea name="notes" value={formData.notes} onChange={handleFormChange} rows="4" className="w-full rounded-xl border border-slate-200 p-4 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm resize-none" placeholder="Bank details, terms of service..." />
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600">Tax (%)</span>
                    <input type="number" name="taxPercentage" value={formData.taxPercentage} onChange={handleFormChange} step="0.5" min="0" max="100" className="w-24 text-right border border-slate-300 rounded-lg p-1.5 text-sm" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600">Discount (NGN)</span>
                    <input type="number" name="discount" value={formData.discount} onChange={handleFormChange} step="0.01" min="0" className="w-32 text-right border border-slate-300 rounded-lg p-1.5 text-sm" />
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-200">
                  <div className="flex justify-between text-sm"><span className="text-slate-600">Subtotal</span><span className="font-semibold text-slate-900">{formatNaira(subtotal)}</span></div>
                  {formData.taxPercentage > 0 && <div className="flex justify-between text-sm"><span className="text-slate-600">Tax ({formData.taxPercentage}%)</span><span className="font-semibold text-slate-900">{formatNaira(tax)}</span></div>}
                  {formData.discount > 0 && <div className="flex justify-between text-sm"><span className="text-emerald-600">Discount</span><span className="font-semibold text-emerald-600">-{formatNaira(formData.discount)}</span></div>}
                  <div className="flex justify-between items-center pt-3 mt-3 border-t border-slate-200">
                    <span className="text-base font-bold text-slate-900">Total</span>
                    <span className="text-2xl font-bold text-primary-600">{formatNaira(total)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-6 mt-6 border-t border-slate-100">
              <Button type="submit" size="lg" isLoading={loading} className="w-full sm:w-auto shadow-md">
                <Save size={18} className="mr-2" /> Create Invoice
              </Button>
              <Button type="button" variant="ghost" size="lg" onClick={onCancel} disabled={loading} className="w-full sm:w-auto">
                <X size={18} className="mr-2" /> Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      {toast.show && <Toast message={toast.message} type={toast.type} duration={3000} onClose={() => setToast({ ...toast, show: false })} />}
    </motion.div>
  );
}
