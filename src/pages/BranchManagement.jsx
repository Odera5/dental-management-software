import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Plus,
  MapPin,
  Phone,
  Pencil,
  Power,
  Star,
  Crown,
  X,
  Globe,
} from "lucide-react";
import api from "../services/api";
import Toast from "../components/Toast";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import ConfirmModal from "../components/ui/ConfirmModal";
import { COUNTRIES } from "../constants/countries";
import { hasEnterpriseAccess } from "../utils/clinicAccess";
import { getStoredUserObject } from "../utils/authStorage";

const initialForm = {
  name: "",
  country: "",
  city: "",
  area: "",
  address: "",
  phone: "",
};

function BranchModal({
  isOpen,
  onClose,
  onSubmit,
  saving,
  form,
  setForm,
  error,
  editingBranch,
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.18 }}
          className="relative z-10 w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {editingBranch ? "Edit Branch" : "Add New Branch"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Create a branch identity like `Ibadan - Bodija` or `Lagos - Ikeja`.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-5 px-6 py-6">
            {error && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {error}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Branch Name"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="e.g. Bodija Branch"
                icon={Building2}
                required
              />
              <Select
                label="Country"
                value={form.country}
                onChange={(event) =>
                  setForm((current) => ({ ...current, country: event.target.value }))
                }
                className="bg-white"
                icon={Globe}
              >
                <option value="">Select a country</option>
                {COUNTRIES.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="City"
                value={form.city}
                onChange={(event) =>
                  setForm((current) => ({ ...current, city: event.target.value }))
                }
                placeholder="e.g. Ibadan"
                icon={MapPin}
                required
              />
              <Input
                label="Area / Locality"
                value={form.area}
                onChange={(event) =>
                  setForm((current) => ({ ...current, area: event.target.value }))
                }
                placeholder="e.g. Bodija"
                icon={MapPin}
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Phone Number"
                value={form.phone}
                onChange={(event) =>
                  setForm((current) => ({ ...current, phone: event.target.value }))
                }
                placeholder="+234..."
                icon={Phone}
              />
              <Input
                label="Address"
                value={form.address}
                onChange={(event) =>
                  setForm((current) => ({ ...current, address: event.target.value }))
                }
                placeholder="Street address"
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
              <Button
                type="button"
                variant="outline"
                className="w-auto bg-white"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button type="submit" className="w-auto" isLoading={saving}>
                {editingBranch ? "Save Branch" : "Create Branch"}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default function BranchManagement() {
  const navigate = useNavigate();
  const storedUser = getStoredUserObject() || {};
  const clinic = storedUser?.clinic || {};
  const enterpriseAccess = hasEnterpriseAccess(clinic);

  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [modalError, setModalError] = useState("");
  const [toast, setToast] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState(null);

  const sortedBranches = useMemo(
    () =>
      [...branches].sort((left, right) => {
        if (left.isPrimary !== right.isPrimary) {
          return left.isPrimary ? -1 : 1;
        }

        return `${left.city} ${left.area} ${left.name}`.localeCompare(
          `${right.city} ${right.area} ${right.name}`,
        );
      }),
    [branches],
  );

  const loadBranches = async () => {
    try {
      setLoading(true);
      const response = await api.get("/branches");
      setBranches(response.data?.branches || []);
    } catch (error) {
      setToast({
        message:
          error.response?.data?.message || "Failed to load enterprise branches.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!enterpriseAccess) {
      setLoading(false);
      return;
    }

    loadBranches();
  }, [enterpriseAccess]);

  const openCreateModal = () => {
    setEditingBranch(null);
    setModalError("");
    setForm(initialForm);
    setModalOpen(true);
  };

  const openEditModal = (branch) => {
    setEditingBranch(branch);
    setModalError("");
    setForm({
      name: branch.name || "",
      country: branch.country || "",
      city: branch.city || "",
      area: branch.area || "",
      address: branch.address || "",
      phone: branch.phone || "",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) {
      return;
    }

    setModalOpen(false);
    setEditingBranch(null);
    setModalError("");
    setForm(initialForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setModalError("");

    try {
      const payload = {
        name: form.name.trim(),
        country: form.country.trim(),
        city: form.city.trim(),
        area: form.area.trim(),
        address: form.address.trim(),
        phone: form.phone.trim(),
      };

      if (editingBranch) {
        const response = await api.put(`/branches/${editingBranch.id}`, payload);
        setBranches((current) =>
          current.map((branch) =>
            branch.id === editingBranch.id ? response.data?.branch || branch : branch,
          ),
        );
        setToast({ message: "Branch updated successfully.", type: "success" });
      } else {
        const response = await api.post("/branches", payload);
        setBranches((current) => [...current, response.data?.branch].filter(Boolean));
        setToast({ message: "Branch created successfully.", type: "success" });
      }

      closeModal();
    } catch (error) {
      const responseData = error.response?.data || {};
      if (responseData?.code === "BRANCH_ALREADY_EXISTS") {
        setModalError(responseData.message);
      } else {
        setModalError(responseData?.message || "We could not save this branch.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (branch) => {
    try {
      const response = await api.patch(`/branches/${branch.id}/status`, {
        isActive: !branch.isActive,
      });
      setBranches((current) =>
        current.map((item) =>
          item.id === branch.id ? response.data?.branch || item : item,
        ),
      );
      setToast({
        message:
          response.data?.message ||
          `Branch ${branch.isActive ? "deactivated" : "activated"} successfully.`,
        type: "success",
      });
    } catch (error) {
      setToast({
        message:
          error.response?.data?.message || "We could not update this branch.",
        type: "error",
      });
    } finally {
      setConfirmConfig(null);
    }
  };

  if (!enterpriseAccess) {
    return (
      <div className="mx-auto flex min-h-full w-full max-w-5xl items-center justify-center p-6 md:p-8">
        <div className="w-full max-w-2xl rounded-[2rem] border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <Crown size={28} />
          </div>
          <h1 className="mt-5 text-3xl font-bold text-slate-900">
            Branch Management Is Enterprise Only
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Multi-branch setup, branch-level locations, and duplicate branch protection
            are available on the Enterprise plan.
          </p>
          <div className="mt-6 flex justify-center">
            <Button className="w-auto" onClick={() => navigate("/upgrade")}>
              View Enterprise Plan
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto w-full max-w-7xl p-6 md:p-8"
    >
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={3500}
          onClose={() => setToast(null)}
        />
      )}

      <ConfirmModal
        isOpen={!!confirmConfig}
        onClose={() => setConfirmConfig(null)}
        {...confirmConfig}
      />

      <BranchModal
        isOpen={modalOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        saving={saving}
        form={form}
        setForm={setForm}
        error={modalError}
        editingBranch={editingBranch}
      />

      <div className="flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm md:flex-row md:items-end md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-sky-700">
            <Crown size={14} />
            Enterprise
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
            Manage Branches
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
            Create physical locations like `Ibadan - Bodija` and `Ibadan - Sango`
            under the same clinic account. Duplicate branch identities are blocked automatically.
          </p>
        </div>
        <Button className="w-auto" onClick={openCreateModal}>
          <Plus size={16} className="mr-2" />
          Add Branch
        </Button>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {loading && (
          <div className="col-span-full rounded-[2rem] border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
            Loading branches...
          </div>
        )}

        {!loading && sortedBranches.length === 0 && (
          <div className="col-span-full rounded-[2rem] border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <Building2 size={24} />
            </div>
            <h2 className="mt-4 text-xl font-bold text-slate-900">
              No branches created yet
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Add your second clinic branch here whenever the business expands.
            </p>
          </div>
        )}

        {!loading &&
          sortedBranches.map((branch) => (
            <div
              key={branch.id}
              className={`rounded-[2rem] border bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${
                branch.isActive
                  ? "border-slate-200 hover:border-primary-200"
                  : "border-slate-200 opacity-80"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-900">
                      {branch.name}
                    </h2>
                    {branch.isPrimary && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-amber-700">
                        <Star size={12} />
                        Primary
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest ${
                        branch.isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {branch.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-600">
                    {branch.city} - {branch.area}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3 text-sm text-slate-600">
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="mt-0.5 text-slate-400" />
                  <span>{branch.address || "No street address added yet."}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={16} className="text-slate-400" />
                  <span>{branch.phone || "No phone number added yet."}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Globe size={16} className="text-slate-400" />
                  <span>{branch.country || "Country not set"}</span>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <Button
                  variant="outline"
                  className="w-auto bg-white"
                  onClick={() => openEditModal(branch)}
                >
                  <Pencil size={15} className="mr-2" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  className={`w-auto ${
                    branch.isActive
                      ? "text-red-600 hover:bg-red-50 hover:text-red-700"
                      : "text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                  }`}
                  onClick={() =>
                    setConfirmConfig({
                      title: `${branch.isActive ? "Deactivate" : "Activate"} Branch`,
                      message: branch.isActive
                        ? `Are you sure you want to deactivate ${branch.name}?`
                        : `Are you sure you want to activate ${branch.name}?`,
                      confirmText: branch.isActive ? "Deactivate" : "Activate",
                      danger: branch.isActive,
                      onConfirm: () => handleToggleStatus(branch),
                    })
                  }
                  disabled={branch.isPrimary && branch.isActive}
                >
                  <Power size={15} className="mr-2" />
                  {branch.isActive ? "Deactivate" : "Activate"}
                </Button>
              </div>
            </div>
          ))}
      </div>
    </motion.div>
  );
}
