import React, { useState, useEffect } from "react";
import api from "../../services/api";
import Toast from "../Toast";
import {
  DEFAULT_PROCEDURE_PRESETS,
  formatNaira,
  normalizeProcedurePresets,
} from "../../constants/billing";
import { getEntityId } from "../../utils/entityId";

export default function InvoiceForm({ patientId = null, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    patientId: patientId || "",
    items: [
      {
        description: "",
        category: "service",
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
      },
    ],
    taxPercentage: 0,
    discount: 0,
    dueDate: "",
    notes: "",
  });

  const [patients, setPatients] = useState([]);
  const [procedurePresets, setProcedurePresets] = useState(DEFAULT_PROCEDURE_PRESETS);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  useEffect(() => {
    fetchPatients();
    fetchClinicProfile();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await api.get("/patients");
      setPatients(response.data);
    } catch (error) {
      console.error("Failed to fetch patients:", error);
    }
  };

  const handlePatientChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      patientId: value,
    }));
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;

    if (field === "quantity" || field === "unitPrice") {
      newItems[index].totalPrice =
        newItems[index].quantity * newItems[index].unitPrice;
    }

    setFormData((prev) => ({
      ...prev,
      items: newItems,
    }));
  };

  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          description: "",
          category: "service",
          quantity: 1,
          unitPrice: 0,
          totalPrice: 0,
        },
      ],
    }));
  };

  const fetchClinicProfile = async () => {
    try {
      const response = await api.get("/auth/clinic-profile");
      setProcedurePresets(
        normalizeProcedurePresets(response.data?.clinic?.procedurePresetPrices),
      );
    } catch (error) {
      console.error("Failed to fetch clinic billing shortcuts:", error);
      setProcedurePresets(DEFAULT_PROCEDURE_PRESETS);
    }
  };

  const handleAddPreset = (preset) => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          description: preset.description,
          category: preset.category,
          quantity: 1,
          unitPrice: preset.unitPrice,
          totalPrice: preset.unitPrice,
        },
      ],
    }));
  };

  const handleRemoveItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      formData.items.length === 0 ||
      formData.items.some((item) => !item.description || item.unitPrice <= 0)
    ) {
      setToast({
        show: true,
        message: "Please fill in all item details",
        type: "error",
      });
      return;
    }

    setLoading(true);

    try {
      await api.post("/invoices", formData);

      setToast({
        show: true,
        message: "Invoice created successfully",
        type: "success",
      });

      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (error) {
      setToast({
        show: true,
        message: error.response?.data?.message || "Failed to create invoice",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const subtotal = formData.items.reduce(
    (sum, item) => sum + item.totalPrice,
    0,
  );
  const tax = subtotal * (formData.taxPercentage / 100);
  const total = subtotal + tax - formData.discount;

  return (
    <div className="p-6 bg-white rounded-lg shadow max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Create Invoice</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient & Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">
              Patient *
            </label>
            <select
              value={formData.patientId}
              onChange={(e) => handlePatientChange(e.target.value)}
              required
              disabled={!!patientId}
              className="w-full border border-gray-300 rounded p-2"
            >
              <option value="">Select Patient</option>
              {patients.map((patient) => (
                <option key={getEntityId(patient)} value={getEntityId(patient)}>
                  {patient.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Due Date</label>
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleFormChange}
              className="w-full border border-gray-300 rounded p-2"
            />
          </div>
        </div>

        {/* Items */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">Items</h3>
            <button
              type="button"
              onClick={handleAddItem}
              className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
            >
              Add Item
            </button>
          </div>

          <div className="mb-4">
            <p className="text-sm font-semibold text-gray-700 mb-2">
              Dental Procedure Shortcuts
            </p>
            <div className="flex flex-wrap gap-2">
              {procedurePresets.map((preset) => (
                <button
                  key={preset.description}
                  type="button"
                  onClick={() => handleAddPreset(preset)}
                  className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm text-blue-700 hover:bg-blue-100"
                >
                  {preset.description} ({formatNaira(preset.unitPrice)})
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Shortcut prices come from Clinic Settings and can be updated by your admin.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-2">Description</th>
                  <th className="text-left py-2">Category</th>
                  <th className="text-center py-2">Qty</th>
                  <th className="text-right py-2">Price</th>
                  <th className="text-right py-2">Total</th>
                  <th className="text-center py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {formData.items.map((item, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="py-2">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) =>
                          handleItemChange(idx, "description", e.target.value)
                        }
                        placeholder="Item description"
                        className="w-full border border-gray-300 rounded p-1"
                      />
                    </td>
                    <td className="py-2">
                      <select
                        value={item.category}
                        onChange={(e) =>
                          handleItemChange(idx, "category", e.target.value)
                        }
                        className="w-full border border-gray-300 rounded p-1"
                      >
                        <option value="service">Service</option>
                        <option value="procedure">Procedure</option>
                        <option value="medication">Medication</option>
                        <option value="lab">Lab</option>
                        <option value="other">Other</option>
                      </select>
                    </td>
                    <td className="py-2">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(
                            idx,
                            "quantity",
                            parseFloat(e.target.value),
                          )
                        }
                        min="1"
                        className="w-full text-center border border-gray-300 rounded p-1"
                      />
                    </td>
                    <td className="py-2">
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) =>
                          handleItemChange(
                            idx,
                            "unitPrice",
                            parseFloat(e.target.value),
                          )
                        }
                        step="0.01"
                        min="0"
                        className="w-full text-right border border-gray-300 rounded p-1"
                      />
                    </td>
                    <td className="py-2 text-right font-semibold pr-2">
                      {formatNaira(item.totalPrice)}
                    </td>
                    <td className="py-2 text-center">
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-red-500 hover:text-red-700 text-sm font-semibold"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Calculations */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Tax %</label>
            <input
              type="number"
              name="taxPercentage"
              value={formData.taxPercentage}
              onChange={handleFormChange}
              step="0.5"
              min="0"
              max="100"
              className="w-full border border-gray-300 rounded p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Discount (NGN)
            </label>
            <input
              type="number"
              name="discount"
              value={formData.discount}
              onChange={handleFormChange}
              step="0.01"
              min="0"
              className="w-full border border-gray-300 rounded p-2"
            />
          </div>
        </div>

        {/* Total Summary */}
        <div className="bg-gray-50 p-4 rounded border border-gray-200">
          <div className="flex justify-between mb-2">
            <span>Subtotal</span>
            <span className="font-semibold">{formatNaira(subtotal)}</span>
          </div>
          {formData.taxPercentage > 0 && (
            <div className="flex justify-between mb-2">
              <span>Tax ({formData.taxPercentage}%)</span>
              <span className="font-semibold">{formatNaira(tax)}</span>
            </div>
          )}
          {formData.discount > 0 && (
            <div className="flex justify-between mb-2 text-green-600">
              <span>Discount</span>
              <span className="font-semibold">-{formatNaira(formData.discount)}</span>
            </div>
          )}
          <div className="flex justify-between border-t pt-2 text-lg font-bold">
            <span>Total</span>
            <span className="text-blue-600">{formatNaira(total)}</span>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-semibold mb-2">Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleFormChange}
            rows="3"
            className="w-full border border-gray-300 rounded p-2"
            placeholder="Add any notes..."
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {loading ? "Creating..." : "Create Invoice"}
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
