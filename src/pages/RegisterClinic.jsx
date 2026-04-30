import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building2,
  Phone,
  MapPin,
  Mail,
  Lock,
  User,
  Globe,
} from "lucide-react";
import api from "../services/api";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";
import usePersistentState from "../hooks/usePersistentState";
import primuxFavicon from "../assets/NewPrimuxcareFavicon.png";
import { COUNTRIES } from "../constants/countries";

const initialForm = {
  clinicName: "",
  clinicEmail: "",
  clinicPhone: "",
  clinicCountry: "",
  clinicCity: "",
  clinicAddress: "",
  adminName: "",
  adminEmail: "",
};

export default function RegisterClinic() {
  const navigate = useNavigate();
  const MotionDiv = motion.div;
  const [form, setForm, clearFormDraft] = usePersistentState(
    "primuxcare:draft:register-clinic",
    initialForm,
  );
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const payload = {
      ...form,
      clinicName: form.clinicName.trim(),
      clinicEmail: form.clinicEmail.trim(),
      clinicPhone: form.clinicPhone.trim(),
      clinicCountry: form.clinicCountry.trim(),
      clinicCity: form.clinicCity.trim(),
      clinicAddress: form.clinicAddress.trim(),
      adminName: form.adminName.trim(),
      adminEmail: form.adminEmail.trim(),
      password: password.trim(),
    };

    if (
      !payload.clinicName ||
      !payload.clinicEmail ||
      !payload.adminName ||
      !payload.adminEmail ||
      !password.trim()
    ) {
      setError(
        "Clinic name, clinic email, admin name, admin email, and password are required.",
      );
      setLoading(false);
      return;
    }

    try {
      const response = await api.post("/auth/register-clinic", payload);
      const successMessage =
        response.data?.message ||
        "Clinic registered successfully. Please check the admin email inbox to confirm the address and activate the account.";
      clearFormDraft();
      setPassword("");
      navigate("/login", { state: { successMessage } });
    } catch (err) {
      const responseData = err.response?.data;

      if (responseData?.code === "CLINIC_EMAIL_EXISTS") {
        setError(
          "That clinic email is already registered. Try a different clinic email or sign in with the existing account.",
        );
      } else if (responseData?.code === "ADMIN_EMAIL_EXISTS") {
        setError(
          "That admin email already belongs to an existing user. Try a different admin email or sign in instead.",
        );
      } else {
        setError(
          responseData?.message ||
            "Clinic registration failed. Please review the details and try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-surface-50 font-sans">
      {/* Left side - Branding/Image */}
      <div className="relative hidden w-[45%] lg:block">
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-primary-950/80 via-primary-900/60 to-primary-600/40 mix-blend-multiply" />
        <img
          src="/auth_bg.png"
          alt="Abstract Medical Tech"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 z-20 flex flex-col items-start justify-center space-y-8 px-16 text-white">
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="mb-6 flex">
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white/10 p-1 backdrop-blur-md">
                <img
                  src={primuxFavicon}
                  alt="PrimuxCare logo"
                  className="h-full w-full object-contain"
                />
              </div>
            </div>
            <h1 className="mb-4 text-4xl font-bold leading-tight tracking-tight text-white">
              The modern operating system for forward-thinking clinics.
            </h1>
            <p className="max-w-md text-lg text-primary-50/80">
              Each clinic gets its own staff accounts and patient data space.
              Patient records, appointments, and billing stay perfectly isolated
              and secure within your clinic.
            </p>
          </MotionDiv>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex w-full overflow-y-auto px-4 py-12 lg:w-[55%] lg:px-12 xl:px-24">
        <MotionDiv
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="m-auto w-full max-w-xl space-y-8"
        >
          <div>
            <div className="mb-6 flex justify-center lg:hidden">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100 p-1">
                <img
                  src={primuxFavicon}
                  alt="PrimuxCare logo"
                  className="h-full w-full object-contain"
                />
              </div>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Register Clinic
            </h2>
            <p className="mt-2 text-slate-500">
              Set up the clinic and primary admin details to get started.
            </p>
          </div>

          {error && (
            <MotionDiv
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-100"
            >
              {error}
            </MotionDiv>
          )}

          {success && (
            <MotionDiv
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="rounded-xl bg-primary-50 p-4 text-sm text-primary-700 border border-primary-100"
            >
              {success}
            </MotionDiv>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Phase 1: Clinic Details */}
            <div className="space-y-4 rounded-2xl border border-surface-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
                Clinic Details
              </h3>
              <Input
                label="Clinic Name"
                name="clinicName"
                type="text"
                icon={Building2}
                value={form.clinicName}
                onChange={handleChange}
                placeholder="e.g. Apex Medical Center"
                required
              />
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Clinic Email"
                  name="clinicEmail"
                  type="email"
                  icon={Mail}
                  value={form.clinicEmail}
                  onChange={handleChange}
                  placeholder="contact@clinic.com"
                  required
                />
                <Input
                  label="Phone Number"
                  name="clinicPhone"
                  type="text"
                  icon={Phone}
                  value={form.clinicPhone}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Select
                  label="Country"
                  name="clinicCountry"
                  icon={Globe}
                  value={form.clinicCountry || ""}
                  onChange={handleChange}
                  className="bg-white"
                >
                  <option value="" disabled>
                    Select a country
                  </option>
                  {COUNTRIES.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </Select>
                <Input
                  label="City"
                  name="clinicCity"
                  type="text"
                  icon={MapPin}
                  value={form.clinicCity}
                  onChange={handleChange}
                  placeholder="e.g. New York"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">
                  Clinic Address
                </label>
                <textarea
                  name="clinicAddress"
                  value={form.clinicAddress}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-surface-200 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  rows={3}
                  placeholder="Full street address"
                />
              </div>
            </div>

            {/* Phase 2: Admin Details */}
            <div className="space-y-4 rounded-2xl border border-surface-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
                Primary Admin Detail
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Admin Name"
                  name="adminName"
                  type="text"
                  icon={User}
                  value={form.adminName}
                  onChange={handleChange}
                  placeholder="Full Name"
                  required
                />
                <Input
                  label="Admin Email"
                  name="adminEmail"
                  type="email"
                  icon={Mail}
                  value={form.adminEmail}
                  onChange={handleChange}
                  placeholder="admin@clinic.com"
                  required
                />
              </div>
              <Input
                label="Password"
                name="password"
                type="password"
                icon={Lock}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <Button type="submit" size="lg" isLoading={loading}>
              Create Clinic Environment
            </Button>
          </form>

          <div className="flex justify-between border-t border-surface-200 pt-6">
            <Link
              to="/login"
              className="text-sm font-medium text-slate-500 hover:text-primary-600"
            >
              &larr; Back to Login
            </Link>
            <p className="text-sm text-slate-500">
              Need support?{" "}
              <Link
                to="/support"
                className="font-medium text-primary-600 hover:text-primary-700 hover:underline"
              >
                Contact us
              </Link>
            </p>
          </div>
        </MotionDiv>
      </div>
    </div>
  );
}
