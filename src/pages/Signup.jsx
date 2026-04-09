import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const supportEmail = "primuxcare@gmail.com";
const whatsappNumber = "08068073362";
const whatsappLink = "https://wa.me/2348068073362";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("nurse");
  const [staff, setStaff] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [staffLoading, setStaffLoading] = useState(true);
  const [busyStaffId, setBusyStaffId] = useState("");
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    if (!currentUser || currentUser.role !== "admin") {
      navigate("/login", { replace: true });
      return;
    }

    fetchStaff();
  }, [navigate]);

  const fetchStaff = async () => {
    try {
      setStaffLoading(true);
      const response = await api.get("/auth/staff");
      setStaff(response.data || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load staff accounts");
    } finally {
      setStaffLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setRole("nurse");
  };

  const handleSignup = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      await api.post("/auth/signup", { name, email, password, role });

      setSuccess("Staff account created successfully");
      resetForm();
      await fetchStaff();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Staff creation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (staffMember) => {
    const nextStatus = !staffMember.isActive;

    try {
      setBusyStaffId(staffMember.id);
      setError("");
      setSuccess("");

      const response = await api.patch(`/auth/staff/${staffMember.id}/status`, {
        isActive: nextStatus,
      });

      setSuccess(response.data?.message || "Staff status updated");
      await fetchStaff();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to update staff status");
    } finally {
      setBusyStaffId("");
    }
  };

  const handleDelete = async (staffMember) => {
    const shouldDelete = window.confirm(
      `Delete ${staffMember.name}'s account permanently?`,
    );
    if (!shouldDelete) return;

    try {
      setBusyStaffId(staffMember.id);
      setError("");
      setSuccess("");

      const response = await api.delete(`/auth/staff/${staffMember.id}`);
      setSuccess(response.data?.message || "Staff account deleted");
      await fetchStaff();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to delete staff account");
    } finally {
      setBusyStaffId("");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Manage Staff</h1>
            <p className="text-sm text-gray-600">
              Only admin-created active staff accounts can log in.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigate("/clinic-settings")}
              className="rounded bg-slate-800 px-4 py-2 text-white hover:bg-slate-900"
            >
              Settings
            </button>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
            >
              Back to Dashboard
            </button>
          </div>
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

        <div className="grid gap-6 lg:grid-cols-[360px,1fr]">
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-lg font-semibold">Create Staff Account</h2>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm">Full Name</label>
                <input
                  type="text"
                  className="w-full rounded border px-3 py-2"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm">Email</label>
                <input
                  type="email"
                  className="w-full rounded border px-3 py-2"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm">Password</label>
                <input
                  type="password"
                  className="w-full rounded border px-3 py-2"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm">Role</label>
                <select
                  className="w-full rounded border px-3 py-2"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="nurse">Nurse</option>
                  <option value="doctor">Doctor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleSignup}
                disabled={loading}
                className="w-full rounded bg-green-600 py-2 text-white hover:bg-green-700 disabled:bg-gray-400"
              >
                {loading ? "Creating..." : "Create Staff Account"}
              </button>
            </div>

            <div className="mt-6 rounded-lg border border-teal-200 bg-teal-50 p-4">
              <h3 className="text-sm font-semibold text-teal-900">Need help? Contact us</h3>
              <p className="mt-2 text-sm text-teal-900">
                If you need technical help with the product, contact us at{" "}
                <a
                  href={`mailto:${supportEmail}`}
                  className="font-medium underline"
                >
                  {supportEmail}
                </a>
                .
              </p>
              <p className="mt-2 text-sm text-teal-900">
                WhatsApp:{" "}
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium underline"
                >
                  {whatsappNumber}
                </a>
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-lg font-semibold">Existing Staff</h2>

            {staffLoading ? (
              <p className="text-sm text-gray-500">Loading staff accounts...</p>
            ) : staff.length === 0 ? (
              <p className="text-sm text-gray-500">No staff accounts found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-200 text-sm">
                  <thead className="bg-gray-100 text-left">
                    <tr>
                      <th className="border px-3 py-2">Name</th>
                      <th className="border px-3 py-2">Email</th>
                      <th className="border px-3 py-2">Role</th>
                      <th className="border px-3 py-2">Status</th>
                      <th className="border px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staff.map((staffMember) => {
                      const isCurrentUser = staffMember.id === currentUser?.id;
                      const isBusy = busyStaffId === staffMember.id;

                      return (
                        <tr key={staffMember.id}>
                          <td className="border px-3 py-2 font-medium">
                            {staffMember.name}
                            {isCurrentUser ? " (You)" : ""}
                          </td>
                          <td className="border px-3 py-2">{staffMember.email}</td>
                          <td className="border px-3 py-2 capitalize">{staffMember.role}</td>
                          <td className="border px-3 py-2">
                            <span
                              className={`rounded px-2 py-1 text-xs font-medium ${
                                staffMember.isActive
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {staffMember.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="border px-3 py-2">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => handleStatusChange(staffMember)}
                                disabled={isBusy}
                                className={`rounded px-3 py-1 text-white ${
                                  staffMember.isActive
                                    ? "bg-amber-600 hover:bg-amber-700"
                                    : "bg-blue-600 hover:bg-blue-700"
                                } disabled:bg-gray-400`}
                              >
                                {staffMember.isActive ? "Deactivate" : "Activate"}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(staffMember)}
                                disabled={isBusy || isCurrentUser}
                                className="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-700 disabled:bg-gray-400"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
