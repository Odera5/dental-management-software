import React, { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

function PasswordToggleIcon({ visible }) {
  return visible ? (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.58 10.58A2 2 0 0012 14a2 2 0 001.42-.58"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.88 5.09A10.94 10.94 0 0112 4.91c5.05 0 8.27 4.48 9 5.59a1 1 0 010 1.09 18.8 18.8 0 01-4.24 4.53"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.61 6.62A18.23 18.23 0 003 10.5a1 1 0 000 1.09c.73 1.11 3.95 5.59 9 5.59a10.9 10.9 0 004.04-.78"
      />
    </svg>
  ) : (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.46 12.29C3.73 10.22 7.03 5.91 12 5.91s8.27 4.31 9.54 6.38a.94.94 0 010 .97C20.27 15.33 16.97 19.64 12 19.64s-8.27-4.31-9.54-6.38a.94.94 0 010-.97z"
      />
      <circle cx="12" cy="12.78" r="3" />
    </svg>
  );
}

const initialForm = {
  clinicName: "",
  clinicEmail: "",
  clinicPhone: "",
  clinicCity: "",
  clinicAddress: "",
  adminName: "",
  adminEmail: "",
  password: "",
};

export default function RegisterClinic() {
  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
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
      clinicCity: form.clinicCity.trim(),
      clinicAddress: form.clinicAddress.trim(),
      adminName: form.adminName.trim(),
      adminEmail: form.adminEmail.trim(),
    };

    if (
      !payload.clinicName ||
      !payload.clinicEmail ||
      !payload.adminName ||
      !payload.adminEmail ||
      !form.password.trim()
    ) {
      setError(
        "Clinic name, clinic email, admin name, admin email, and password are required.",
      );
      setLoading(false);
      return;
    }

    try {
      const response = await api.post("/auth/register-clinic", payload);
      setSuccess(
        response.data?.message ||
          "Clinic registered successfully. Please check the admin email inbox to confirm the address and activate the account.",
      );
      setForm(initialForm);
    } catch (err) {
      const status = err.response?.status;
      const responseData = err.response?.data;

      console.error("Clinic registration error:", {
        status,
        data: responseData,
        error: err,
      });

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
    <div className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200">
        <div className="grid lg:grid-cols-[1.05fr,0.95fr]">
          <div className="bg-slate-900 px-8 py-10 text-white">
            <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">
              BHF Clinic Onboarding
            </p>
            <p className="mt-3 text-sm font-medium text-slate-300">
              by PrimuxCare
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-tight">
              Register your clinic, enter your clinic details, and create your admin account.
            </h1>
            <p className="mt-4 max-w-lg text-sm text-slate-200">
              Each clinic gets its own staff accounts and patient data space. Once
              you finish registration, the admin email receives a verification link
              to activate the account before signing in. Only staff accounts created
              by that clinic admin can sign in.
            </p>

            <div className="mt-8 space-y-4 text-sm text-slate-200">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                Clinic administrators can create staff accounts for doctors, nurses,
                and additional admins.
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                Patient records, appointments, billing, and waiting room activity stay
                within your clinic.
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                Need help before onboarding? Visit the support page or contact the PrimuxCare
                team directly.
              </div>
            </div>
          </div>

          <div className="px-8 py-10">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">
                  Register Clinic
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Set up the clinic and primary admin details.
                </p>
              </div>
              <Link
                to="/login"
                className="text-sm font-medium text-blue-700 hover:text-blue-800"
              >
                Back to login
              </Link>
            </div>

            {error && (
              <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}
            {success && (
              <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {success}
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-900">
                  Clinic Details
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  Enter the clinic's contact details. This email can be the same as, or different from, the admin email below.
                </p>
              </div>

              <div>
                <label htmlFor="clinicName" className="mb-1 block text-sm text-slate-700">
                  Clinic Name
                </label>
                <input
                  id="clinicName"
                  name="clinicName"
                  type="text"
                  value={form.clinicName}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3"
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="clinicEmail" className="mb-1 block text-sm text-slate-700">
                    Clinic Email
                  </label>
                  <input
                    id="clinicEmail"
                    name="clinicEmail"
                    type="email"
                    value={form.clinicEmail}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="clinicPhone" className="mb-1 block text-sm text-slate-700">
                    Clinic Phone
                  </label>
                  <input
                    id="clinicPhone"
                    name="clinicPhone"
                    type="text"
                    value={form.clinicPhone}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="clinicCity" className="mb-1 block text-sm text-slate-700">
                  City
                </label>
                <input
                  id="clinicCity"
                  name="clinicCity"
                  type="text"
                  value={form.clinicCity}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3"
                />
              </div>

              <div>
                <label htmlFor="clinicAddress" className="mb-1 block text-sm text-slate-700">
                  Clinic Address
                </label>
                <textarea
                  id="clinicAddress"
                  name="clinicAddress"
                  value={form.clinicAddress}
                  onChange={handleChange}
                  className="min-h-24 w-full rounded-xl border border-slate-200 px-4 py-3"
                />
              </div>

              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-900">
                  Primary Admin Details
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  This is the first staff account for the clinic. It can belong to the owner or any trusted person managing the clinic software.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="adminName" className="mb-1 block text-sm text-slate-700">
                    Primary Admin Name
                  </label>
                  <input
                    id="adminName"
                    name="adminName"
                    type="text"
                    value={form.adminName}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="adminEmail" className="mb-1 block text-sm text-slate-700">
                    Primary Admin Email
                  </label>
                  <input
                    id="adminEmail"
                    name="adminEmail"
                    type="email"
                    value={form.adminEmail}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="mb-1 block text-sm text-slate-700">
                  Primary Admin Password
                </label>
                <div className="flex gap-2">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="rounded-xl border border-slate-200 px-4 py-3 text-slate-700 hover:bg-slate-50"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                  >
                    <PasswordToggleIcon visible={showPassword} />
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-slate-900 px-4 py-3 text-white transition hover:bg-slate-800 disabled:bg-slate-400"
              >
                {loading ? "Creating clinic account..." : "Create Clinic Account"}
              </button>
            </form>

            <p className="mt-5 text-sm text-slate-600">
              Already registered?{" "}
              <Link to="/login" className="font-medium text-blue-700 hover:text-blue-800">
                Sign in here
              </Link>
              . Need support?{" "}
              <Link to="/support" className="font-medium text-blue-700 hover:text-blue-800">
                Contact us
              </Link>
              .
            </p>
            <p className="mt-3 text-xs text-slate-400">
              BHF is built by PrimuxCare.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
