import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Plus, UserCog, ArrowLeft, Activity, User, Phone, MapPin, Hash } from "lucide-react";
import api from "../services/api";
import Toast from "../components/Toast";
import Modal from "../components/PatientRecord/Modal";
import RecordForm from "../components/PatientRecord/RecordForm";
import RecordItem from "../components/PatientRecord/RecordItem";
import SearchFilterSort from "../components/PatientRecord/SearchFilterSort";
import { createEmptyRecord } from "../components/PatientRecord/recordUtils";
import { getEntityId } from "../utils/entityId";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { Card, CardContent } from "../components/ui/Card";

const RECORDS_PER_PAGE = 10;

export default function PatientRecord() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const storedUser = JSON.parse((localStorage.getItem("user") || sessionStorage.getItem("user"))) || {};
  const canEditPatient = storedUser.role === "admin" || storedUser.role === "doctor";
  const canManageRecords = storedUser.role === "admin" || storedUser.role === "doctor";
  const returnTo = location.state?.returnTo || null;

  const [patient, setPatient] = useState(null);
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [patientForm, setPatientForm] = useState({ name: "", cardNumber: "", age: "", gender: "other", phone: "", email: "", address: "" });

  const [newRecord, setNewRecord] = useState(createEmptyRecord());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditPatientModal, setShowEditPatientModal] = useState(false);
  const [expandedRecordId, setExpandedRecordId] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [addLoading, setAddLoading] = useState(false);
  const [patientSaveLoading, setPatientSaveLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const showToast = (message, type = "success") => setToast({ show: true, message, type });

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / RECORDS_PER_PAGE));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const pageStartIndex = (currentPageSafe - 1) * RECORDS_PER_PAGE;
  const paginatedRecords = filteredRecords.slice(pageStartIndex, pageStartIndex + RECORDS_PER_PAGE);

  const createFormData = (recordData, removedAttachments = []) => {
    const formData = new FormData();
    Object.keys(recordData).forEach((key) => {
      if (key === "attachments") {
        recordData.attachments.forEach((file) => { if (file instanceof File) formData.append("attachments", file); });
      } else if (key === "teeth") {
        formData.append("teeth", JSON.stringify(recordData.teeth || []));
      } else {
        formData.append(key, recordData[key] || "");
      }
    });
    removedAttachments.forEach((filename) => formData.append("removedAttachments", filename));
    return formData;
  };

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        setLoading(true);
        const resPatient = await api.get(`/patients/${id}`);
        setPatient(resPatient.data);
        setPatientForm({
          name: resPatient.data?.name || "", cardNumber: resPatient.data?.cardNumber || "",
          age: resPatient.data?.age || "", gender: resPatient.data?.gender || "other",
          phone: resPatient.data?.phone || "", email: resPatient.data?.email || "", address: resPatient.data?.address || "",
        });
        const resRecords = await api.get(`/patients/${id}/records`);
        setRecords(resRecords.data);
        setFilteredRecords(resRecords.data);
      } catch (err) { showToast("Failed to fetch patient data", "error"); } finally { setLoading(false); }
    };
    fetchPatient();
  }, [id]);

  const handleAddRecord = async (recordData) => {
    try {
      setAddLoading(true);
      const res = await api.post(`/patients/${id}/records`, createFormData(recordData));
      const updatedRecords = [res.data, ...records];
      setRecords(updatedRecords);
      setFilteredRecords(updatedRecords);
      showToast("Record added successfully!", "success");
      return true;
    } catch (err) { showToast(err.response?.data?.message || "Failed to add record", "error"); return false; } finally { setAddLoading(false); }
  };

  const handleDeleteRecord = async (recordId) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      await api.delete(`/patients/${id}/records/${recordId}`);
      const updatedRecords = records.filter((r) => getEntityId(r) !== recordId);
      setRecords(updatedRecords);
      setFilteredRecords(updatedRecords);
      showToast("Record deleted successfully!", "success");
    } catch (err) { showToast(err.response?.data?.message || "Failed to delete record", "error"); }
  };

  const handleSaveEdit = async (recordId, updatedData, removedAttachments = []) => {
    try {
      const res = await api.put(`/patients/${id}/records/${recordId}`, createFormData(updatedData, removedAttachments));
      const updatedRecords = records.map((r) => getEntityId(r) === recordId ? res.data : r);
      setRecords(updatedRecords);
      setFilteredRecords(updatedRecords);
      showToast("Record updated successfully!", "success");
    } catch (err) { showToast(err.response?.data?.message || "Failed to update record", "error"); }
  };

  const handlePatientFormChange = (e) => setPatientForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const openEditPatientModal = () => {
    if (!patient) return;
    setPatientForm({
      name: patient.name || "", cardNumber: patient.cardNumber || "", age: patient.age || "",
      gender: patient.gender || "other", phone: patient.phone || "", email: patient.email || "", address: patient.address || "",
    });
    setShowEditPatientModal(true);
  };

  const handleUpdatePatient = async (e) => {
    e.preventDefault();
    if (!patientForm.name.trim()) return showToast("Patient name cannot be empty.", "error");
    if (!patientForm.age || Number(patientForm.age) <= 0) return showToast("Age must be greater than 0.", "error");
    if (patientForm.email && !/\S+@\S+\.\S+/.test(patientForm.email)) return showToast("Invalid email.", "error");

    try {
      setPatientSaveLoading(true);
      const res = await api.put(`/patients/${id}`, patientForm);
      setPatient(res.data);
      setShowEditPatientModal(false);
      showToast("Patient information updated successfully!");
    } catch (err) { showToast(err.response?.data?.message || "Failed to update patient information", "error"); } finally { setPatientSaveLoading(false); }
  };

  useEffect(() => { setCurrentPage(1); }, [filteredRecords.length, searchKeyword]);
  useEffect(() => { if (currentPage > totalPages) setCurrentPage(totalPages); }, [currentPage, totalPages]);

  if (loading) return <div className="p-8 text-center flex flex-col items-center justify-center min-h-[50vh]"><div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div><p className="text-slate-500 font-medium">Loading patient data...</p></div>;
  if (!patient) return <div className="p-8 text-center text-rose-500 font-medium"><p>Patient not found or you don't have access.</p></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-surface-200">
        <div>
          <div className="flex items-center gap-2 mb-4">
             <Button variant="outline" size="sm" onClick={() => navigate(returnTo === "/waiting-room" ? "/waiting-room" : "/dashboard")} className="bg-white border-slate-200"><ArrowLeft size={16} className="mr-1" /> Back</Button>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-1 flex items-center">{patient.name}</h2>
          <div className="text-sm font-medium text-slate-500 flex items-center flex-wrap gap-x-4 gap-y-1 mt-2">
             <span className="flex items-center"><Hash size={14} className="mr-1 text-slate-400" /> {patient.cardNumber || "No ID"}</span>
             <span className="flex items-center"><User size={14} className="mr-1 text-slate-400" /> {patient.age}y, <span className="capitalize ml-1">{patient.gender || "Other"}</span></span>
             {patient.phone && <span className="flex items-center"><Phone size={14} className="mr-1 text-slate-400" /> {patient.phone}</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto mt-4 md:mt-0">
          {canEditPatient && <Button variant="outline" onClick={openEditPatientModal} className="flex-1 md:flex-none border-primary-200 text-primary-700 bg-primary-50 hover:bg-primary-100"><UserCog size={18} className="mr-2" /> Edit Info</Button>}
          {canManageRecords && <Button onClick={() => setShowAddModal(true)} className="flex-1 md:flex-none shadow-md"><Plus size={18} className="mr-2" /> New Record</Button>}
        </div>
      </div>

      <SearchFilterSort records={records} onFiltered={(filtered, keyword) => { setFilteredRecords(filtered); setSearchKeyword(keyword); }} />

      <div className="space-y-4">
        {filteredRecords.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center shadow-sm flex flex-col items-center">
             <Activity size={48} className="text-slate-300 mb-4" />
             <p className="text-lg font-medium text-slate-700">No clinical records found</p>
             <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">Create a new record to begin adding history, exams, and dental charting.</p>
          </div>
        ) : (
          paginatedRecords.map((record) => (
            <RecordItem key={getEntityId(record)} record={record} expandedRecordId={expandedRecordId} setExpandedRecordId={setExpandedRecordId} handleDelete={handleDeleteRecord} handleSaveEdit={handleSaveEdit} searchKeyword={searchKeyword} canManageRecords={canManageRecords} />
          ))
        )}
      </div>

      {filteredRecords.length > 0 && (
        <Card className="border-0 shadow-sm bg-white mt-6">
          <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm font-medium text-slate-600">Showing <strong className="text-slate-900">{pageStartIndex + 1}-{Math.min(pageStartIndex + RECORDS_PER_PAGE, filteredRecords.length)}</strong> of <strong className="text-slate-900">{filteredRecords.length}</strong> records</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPageSafe === 1} className="bg-white">Previous</Button>
              <span className="text-sm font-bold text-slate-700 px-2 lg:px-4">{currentPageSafe} / {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPageSafe === totalPages} className="bg-white">Next</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showAddModal && (
        <Modal onClose={() => setShowAddModal(false)}>
          <div className="mb-6 border-b border-slate-100 pb-4">
            <h2 className="text-2xl font-bold text-slate-900">New Clinical Record</h2>
            <p className="text-slate-500 text-sm mt-1">Add history, examinations, dental charting and treatment plan.</p>
          </div>
          <RecordForm recordData={newRecord} setRecordData={setNewRecord} onSubmit={async (e) => { e.preventDefault(); const ok = await handleAddRecord(newRecord); if (ok) { setNewRecord(createEmptyRecord()); setShowAddModal(false); } }} submitLabel="Save Record" loading={addLoading} />
        </Modal>
      )}

      {showEditPatientModal && (
        <Modal onClose={() => setShowEditPatientModal(false)}>
          <div className="mb-6 border-b border-slate-100 pb-4">
            <h2 className="text-2xl font-bold text-slate-900">Edit Patient Details</h2>
          </div>
          <form onSubmit={handleUpdatePatient} className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2 bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <Input label="Patient Name *" name="name" value={patientForm.name} onChange={handlePatientFormChange} disabled={patientSaveLoading} className="bg-white" />
              <div className="space-y-1.5 focus-within:text-primary-600"><label className="text-sm font-semibold text-slate-700 leading-none">Patient UID <span className="opacity-50">(Auto)</span></label><input type="text" value={patientForm.cardNumber} disabled className="w-full rounded-xl border border-slate-200 p-3 bg-slate-100 text-slate-500 text-sm font-mono h-[46px]" /></div>
              <Input label="Age *" name="age" type="number" min="0" value={patientForm.age} onChange={handlePatientFormChange} disabled={patientSaveLoading} className="bg-white" />
              <div className="space-y-1.5 focus-within:text-primary-600"><label className="text-sm font-semibold text-slate-700 leading-none">Sex</label><select name="gender" value={patientForm.gender} onChange={handlePatientFormChange} disabled={patientSaveLoading} className="w-full rounded-xl border border-slate-200 p-3 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm h-[46px] capitalize"><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
              <Input label="Phone Number" name="phone" value={patientForm.phone} onChange={handlePatientFormChange} disabled={patientSaveLoading} className="bg-white" />
              <Input label="Email Address" name="email" type="email" value={patientForm.email} onChange={handlePatientFormChange} disabled={patientSaveLoading} className="bg-white" />
              <div className="sm:col-span-2 space-y-1.5"><label className="text-sm font-semibold text-slate-700 leading-none">Home Address</label><textarea name="address" value={patientForm.address} onChange={handlePatientFormChange} disabled={patientSaveLoading} rows="2" className="w-full rounded-xl border border-slate-200 p-3 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm resize-none" /></div>
            </div>
            <div className="flex gap-4 pt-4 border-t border-slate-100">
              <Button type="button" variant="ghost" onClick={() => setShowEditPatientModal(false)} disabled={patientSaveLoading} className="flex-1">Cancel</Button>
              <Button type="submit" isLoading={patientSaveLoading} className="flex-1 shadow-md">Save Changes</Button>
            </div>
          </form>
        </Modal>
      )}
      
      {toast.show && <Toast message={toast.message} type={toast.type} duration={3000} onClose={() => setToast({ ...toast, show: false })} />}
    </motion.div>
  );
}
