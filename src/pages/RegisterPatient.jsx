// src/pages/RegisterPatient.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Toast from "../components/Toast";

export default function RegisterPatient() {
  const [form, setForm] = useState({
    name: "",
    cardNumber: "",
    age: "",
    email: "",
    gender: "other",
    phone: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const navigate = useNavigate();
  const showToast = (message, type = "success") => setToast({ message, type });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!form.name.trim()) return showToast("Name cannot be empty.", "error");
    if (!form.age || Number(form.age) <= 0) return showToast("Age must be greater than 0.", "error");
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) return showToast("Invalid email address.", "error");

    try {
      setLoading(true);

      // Ensure all fields are strings for backend encryption
      const payload = {
        name: form.name.trim(),
        cardNumber: form.cardNumber?.trim() || "",
        age: form.age.toString(),
        gender: form.gender || "other",
        phone: form.phone?.trim() || "",
        address: form.address?.trim() || "",
        email: form.email?.trim() || "",
      };

      // Send patient to backend
      const res = await api.post("/patients", payload);

      showToast(`Patient "${res.data.name}" added successfully!`, "success");

      // Reset form
      setForm({
        name: "",
        cardNumber: "",
        age: "",
        email: "",
        gender: "other",
        phone: "",
        address: "",
      });

      // Redirect to dashboard with decrypted patient data
      navigate("/dashboard", { state: { newPatient: res.data } });
    } catch (err) {
      console.error("Add patient error:", err.response?.data || err);
      const msg = err.response?.data?.message || "Failed to add patient. Please check your inputs.";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      {toast && <Toast message={toast.message} type={toast.type} duration={3000} onClose={() => setToast(null)} />}

      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Register Patient</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block mb-1 font-medium">Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Patient Card Number</label>
            <input
              type="text"
              name="cardNumber"
              value={form.cardNumber}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              disabled={loading}
              placeholder="e.g. BHF-000123"
            />
          </div>

          {/* Age */}
          <div>
            <label className="block mb-1 font-medium">Age</label>
            <input
              type="number"
              name="age"
              value={form.age}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              disabled={loading}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block mb-1 font-medium">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              disabled={loading}
              placeholder="patient@example.com"
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block mb-1 font-medium">Gender</label>
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              disabled={loading}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Phone */}
          <div>
            <label className="block mb-1 font-medium">Phone</label>
            <input
              type="text"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              disabled={loading}
            />
          </div>

          {/* Address */}
          <div>
            <label className="block mb-1 font-medium">Address</label>
            <input
              type="text"
              name="address"
              value={form.address}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              disabled={loading}
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-between mt-4">
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 rounded text-white ${
                loading ? "bg-blue-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading ? "Adding..." : "Add Patient"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Back
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
