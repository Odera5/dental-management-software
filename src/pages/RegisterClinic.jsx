import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/register-clinic", form);
      const { accessToken, refreshToken, user } = response.data;

      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("user", JSON.stringify(user));

      navigate("/dashboard");
    } catch (err) {
      console.error("Clinic registration error:", err);
      setError(
        err.response?.data?.message ||
          "Clinic registration failed. Please review the details and try again.",
      );
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
              you finish registration, you can log in immediately and start adding
              your team. Only staff accounts created by that clinic admin can sign in.
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

            <form onSubmit={handleSubmit} className="space-y-4">
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

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="adminName" className="mb-1 block text-sm text-slate-700">
                    Admin Name
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
                    Admin Email
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
                  Admin Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3"
                  minLength={6}
                  required
                />
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
