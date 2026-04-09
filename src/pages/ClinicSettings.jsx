import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { logoutCurrentUser } from "../services/api";
import {
  DEFAULT_PROCEDURE_PRESETS,
  formatNaira,
  normalizeProcedurePresets,
} from "../constants/billing";

const initialForm = {
  clinicName: "",
  clinicEmail: "",
  clinicPhone: "",
  clinicCity: "",
  clinicAddress: "",
  contactPerson: "",
  procedurePresetPrices: DEFAULT_PROCEDURE_PRESETS,
};

export default function ClinicSettings() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");
    if (!storedUser || storedUser.role !== "admin") {
      navigate("/login", { replace: true });
      return;
    }

    const fetchClinicProfile = async () => {
      try {
        setLoading(true);
        const response = await api.get("/auth/clinic-profile");
        const clinic = response.data?.clinic;

        setForm({
          clinicName: clinic?.name || "",
          clinicEmail: clinic?.email || "",
          clinicPhone: clinic?.phone || "",
          clinicCity: clinic?.city || "",
          clinicAddress: clinic?.address || "",
          contactPerson: clinic?.contactPerson || "",
          procedurePresetPrices: normalizeProcedurePresets(clinic?.procedurePresetPrices),
        });
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || "Failed to load clinic profile");
      } finally {
        setLoading(false);
      }
    };

    fetchClinicProfile();
  }, [navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleProcedurePriceChange = (index, value) => {
    setForm((current) => ({
      ...current,
      procedurePresetPrices: current.procedurePresetPrices.map((preset, presetIndex) =>
        presetIndex === index
          ? {
              ...preset,
              unitPrice: value === "" ? "" : Number(value),
            }
          : preset,
      ),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await api.put("/auth/clinic-profile", form);
      const clinic = response.data?.clinic;

      const storedUser = JSON.parse(localStorage.getItem("user") || "null");
      if (storedUser) {
        const updatedUser = {
          ...storedUser,
          clinic: {
            ...storedUser.clinic,
            ...clinic,
          },
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }

      setForm({
        clinicName: clinic?.name || "",
        clinicEmail: clinic?.email || "",
        clinicPhone: clinic?.phone || "",
        clinicCity: clinic?.city || "",
        clinicAddress: clinic?.address || "",
        contactPerson: clinic?.contactPerson || "",
        procedurePresetPrices: normalizeProcedurePresets(clinic?.procedurePresetPrices),
      });
      setSuccess(response.data?.message || "Clinic profile updated successfully");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to update clinic profile");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivateClinic = async () => {
    const confirmed = window.confirm(
      "Deactivate this clinic account? All staff logins will be blocked until support reactivates the clinic.",
    );

    if (!confirmed) return;

    try {
      setDeactivating(true);
      setError("");
      setSuccess("");

      await api.patch("/auth/clinic-profile/deactivate");
      await logoutCurrentUser();
      navigate("/login", { replace: true });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to deactivate clinic");
    } finally {
      setDeactivating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Clinic Settings</h1>
            <p className="text-sm text-gray-600">
              View and edit your clinic profile information here.
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-gray-400">
              BHF by PrimuxCare
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/signup")}
            className="rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
          >
            Back to Manage Staff
          </button>
        </div>

        {(error || success) && (
          <div className="space-y-2">
            {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            {success && (
              <p className="rounded bg-green-50 px-3 py-2 text-sm text-green-700">
                {success}
              </p>
            )}
          </div>
        )}

        <div className="rounded-lg bg-white p-6 shadow-md">
          {loading ? (
            <p className="text-sm text-gray-500">Loading clinic profile...</p>
          ) : (
            <div className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm">Clinic Name</label>
                    <input
                      type="text"
                      name="clinicName"
                      value={form.clinicName}
                      onChange={handleChange}
                      className="w-full rounded border px-3 py-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm">Clinic Email</label>
                    <input
                      type="email"
                      name="clinicEmail"
                      value={form.clinicEmail}
                      onChange={handleChange}
                      className="w-full rounded border px-3 py-2"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm">Clinic Phone</label>
                    <input
                      type="text"
                      name="clinicPhone"
                      value={form.clinicPhone}
                      onChange={handleChange}
                      className="w-full rounded border px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm">City</label>
                    <input
                      type="text"
                      name="clinicCity"
                      value={form.clinicCity}
                      onChange={handleChange}
                      className="w-full rounded border px-3 py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm">Clinic Address</label>
                  <textarea
                    name="clinicAddress"
                    value={form.clinicAddress}
                    onChange={handleChange}
                    className="min-h-24 w-full rounded border px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm">Contact Person</label>
                  <input
                    type="text"
                    name="contactPerson"
                    value={form.contactPerson}
                    onChange={handleChange}
                    className="w-full rounded border px-3 py-2"
                  />
                </div>

                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold text-emerald-900">
                      Billing Shortcut Prices
                    </h2>
                    <p className="mt-1 text-sm text-emerald-800">
                      Set the default NGN prices used in the dental procedure shortcuts during invoice creation.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {form.procedurePresetPrices.map((preset, index) => (
                      <div
                        key={preset.description}
                        className="grid gap-3 rounded-lg border border-emerald-100 bg-white p-3 md:grid-cols-[1.5fr_180px_auto]"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{preset.description}</p>
                          <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                            {preset.category}
                          </p>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-gray-600">
                            Price (NGN)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={preset.unitPrice}
                            onChange={(event) =>
                              handleProcedurePriceChange(index, event.target.value)
                            }
                            className="w-full rounded border px-3 py-2"
                          />
                        </div>
                        <div className="flex items-end text-sm font-semibold text-emerald-700">
                          {formatNaira(preset.unitPrice)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </form>

              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <h2 className="text-lg font-semibold text-red-900">Deactivate Clinic</h2>
                <p className="mt-2 text-sm text-red-800">
                  If your clinic no longer wants to use the product, you can deactivate
                  the clinic account here. All staff logins will be blocked until support
                  reactivates the clinic.
                </p>
                <button
                  type="button"
                  onClick={handleDeactivateClinic}
                  disabled={deactivating}
                  className="mt-4 rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:bg-gray-400"
                >
                  {deactivating ? "Deactivating..." : "Deactivate Clinic"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
