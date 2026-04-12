import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Calendar, Mail, MapPin, Phone, Hash, Info, UserPlus } from "lucide-react";
import api from "../services/api";
import Toast from "../components/Toast";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";

export default function RegisterPatient() {
  const [form, setForm] = useState({
    name: "",
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

    if (!form.name.trim()) return showToast("Name cannot be empty.", "error");
    if (!form.age || Number(form.age) <= 0) return showToast("Age must be greater than 0.", "error");
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) return showToast("Invalid email address.", "error");

    try {
      setLoading(true);

      const payload = {
        name: form.name.trim(),
        age: form.age.toString(),
        gender: form.gender || "other",
        phone: form.phone?.trim() || "",
        address: form.address?.trim() || "",
        email: form.email?.trim() || "",
      };

      const res = await api.post("/patients", payload);

      showToast(`Patient "${res.data.name}" added successfully!`, "success");

      setForm({ name: "", age: "", email: "", gender: "other", phone: "", address: "" });

      navigate("/waiting-room", {
        state: {
          newPatient: res.data,
          preselectPatientId: res.data?.id || res.data?._id || "",
        },
      });
    } catch (err) {
      console.error("Add patient error:", err.response?.data || err);
      const msg = err.response?.data?.message || "Failed to add patient. Please check your inputs.";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl w-full mx-auto h-full overflow-y-auto">
      {toast && <Toast message={toast.message} type={toast.type} duration={3000} onClose={() => setToast(null)} />}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="border-0 shadow-lg bg-white overflow-hidden">
          <div className="relative px-8 py-10 text-white overflow-hidden bg-gradient-to-r from-primary-600 via-primary-700 to-indigo-800 rounded-t-xl">
            {/* Ambient background glows */}
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-black/20 rounded-full blur-3xl pointer-events-none"></div>

            <div className="absolute top-1/2 right-4 md:right-12 opacity-15 transform -translate-y-1/2 pointer-events-none">
               <UserPlus size={180} />
            </div>
            
            <div className="relative z-10 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-sm font-medium border border-white/20 backdrop-blur-md shadow-sm">
                 <Info size={16} className="text-cyan-200" />
                 Card numbers are assigned automatically
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm">Patient Registration</h2>
              <p className="text-primary-100 max-w-xl text-lg leading-relaxed">
                 Fill out the details below to create a new patient record. Once registered, the patient will be placed directly in the waiting room triage queue.
              </p>
            </div>
          </div>

          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid gap-6 md:grid-cols-2">
                <Input
                  label="Full Name"
                  name="name"
                  icon={User}
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Jane Doe"
                  disabled={loading}
                  required
                />
                
                <Input
                  label="Age"
                  name="age"
                  type="number"
                  icon={Calendar}
                  value={form.age}
                  onChange={handleChange}
                  placeholder="e.g. 34"
                  disabled={loading}
                  required
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                 <div className="space-y-1.5">
                   <label className="text-sm font-medium text-slate-700">Gender</label>
                   <div className="relative">
                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                       <Hash size={18} className="text-slate-400" />
                     </div>
                     <select
                       name="gender"
                       value={form.gender}
                       onChange={handleChange}
                       className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-3 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none h-[46px]"
                       disabled={loading}
                     >
                       <option value="male">Male</option>
                       <option value="female">Female</option>
                       <option value="other">Other</option>
                     </select>
                   </div>
                 </div>

                 <Input
                  label="Phone Number"
                  name="phone"
                  icon={Phone}
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                  disabled={loading}
                />
              </div>

              <Input
                label="Email Address"
                name="email"
                type="email"
                icon={Mail}
                value={form.email}
                onChange={handleChange}
                placeholder="patient@example.com"
                disabled={loading}
              />

              <Input
                label="Residential Address"
                name="address"
                icon={MapPin}
                value={form.address}
                onChange={handleChange}
                placeholder="Full street address"
                disabled={loading}
              />

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-6 mt-6 border-t border-slate-100">
                <Button type="submit" size="lg" isLoading={loading} className="w-full sm:w-auto whitespace-nowrap">
                  Complete Registration
                </Button>
                <Button type="button" variant="ghost" size="lg" onClick={() => navigate("/dashboard")} disabled={loading} className="w-full sm:w-auto whitespace-nowrap">
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
