// src/pages/PatientRecord.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import Toast from "../components/Toast";
import Modal from "../components/PatientRecord/Modal";
import RecordForm from "../components/PatientRecord/RecordForm";
import RecordItem from "../components/PatientRecord/RecordItem";
import SearchFilterSort from "../components/PatientRecord/SearchFilterSort";
import { createEmptyRecord } from "../components/PatientRecord/recordUtils";

export default function PatientRecord() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState("");

  const [newRecord, setNewRecord] = useState(createEmptyRecord());

  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedRecordId, setExpandedRecordId] = useState(null);
  const [toast, setToast] = useState(null);
  const [addLoading, setAddLoading] = useState(false);

  const showToast = (message, type = "success") =>
    setToast({ message, type });

  // ---------------- Helper: Convert record object to FormData ----------------
  const createFormData = (recordData, removedAttachments = []) => {
    const formData = new FormData();

    Object.keys(recordData).forEach((key) => {
      if (key === "attachments") {
        recordData.attachments.forEach((file) => {
          if (file instanceof File) {
            formData.append("attachments", file);
          }
        });
      } else if (key === "teeth") {
        formData.append("teeth", JSON.stringify(recordData.teeth || []));
      } else {
        formData.append(key, recordData[key] || "");
      }
    });

    removedAttachments.forEach((filename) =>
      formData.append("removedAttachments", filename)
    );

    return formData;
  };

  // ---------------- Fetch patient + records ----------------
  useEffect(() => {
    const fetchPatient = async () => {
      try {
        setLoading(true);

        const resPatient = await api.get(`/patients/${id}`, {
        });

        setPatient(resPatient.data);

        const resRecords = await api.get(`/patients/${id}/records`, {
        });

        setRecords(resRecords.data);
        setFilteredRecords(resRecords.data);
      } catch (err) {
        console.error(err);
        showToast("Failed to fetch patient data", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchPatient();
  }, [id]);

  // ---------------- Add record ----------------
  const handleAddRecord = async (recordData) => {
    try {
      setAddLoading(true);

      const formData = createFormData(recordData);

      const res = await api.post(`/patients/${id}/records`, formData);

      const updatedRecords = [...records, res.data];
      setRecords(updatedRecords);
      setFilteredRecords(updatedRecords);

      showToast("Record added successfully!", "success");
      return true;
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to add record", "error");
      return false;
    } finally {
      setAddLoading(false);
    }
  };

  // ---------------- Delete record ----------------
  const handleDeleteRecord = async (recordId) => {
    if (!window.confirm("Are you sure you want to delete this record?"))
      return;

    try {
      await api.delete(`/patients/${id}/records/${recordId}`);

      const updatedRecords = records.filter(
        (r) => r._id !== recordId
      );

      setRecords(updatedRecords);
      setFilteredRecords(updatedRecords);

      showToast("Record deleted successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to delete record", "error");
    }
  };

  // ---------------- Edit record ----------------
  const handleSaveEdit = async (
    recordId,
    updatedData,
    removedAttachments = []
  ) => {
    try {
      const formData = createFormData(updatedData, removedAttachments);

      const res = await api.put(`/patients/${id}/records/${recordId}`, formData);

      const updatedRecords = records.map((r) =>
        r._id === recordId ? res.data : r
      );

      setRecords(updatedRecords);
      setFilteredRecords(updatedRecords);

      showToast("Record updated successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to update record", "error");
    }
  };

  // ---------------- Render ----------------
  if (loading)
    return <p className="p-6">Loading patient data...</p>;

  if (!patient)
    return (
      <p className="p-6 text-red-600">
        Patient not found.
      </p>
    );

  return (
    <div className="min-h-screen bg-gray-100 p-6 relative">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={3000}
          onClose={() => setToast(null)}
        />
      )}

      <button
        onClick={() => navigate("/dashboard")}
        className="mb-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
      >
        Back to Dashboard
      </button>

      <h1 className="text-2xl font-bold mb-2">
        {patient.name}'s Records
      </h1>

      <p className="text-gray-600 mb-4">
        Age: {patient.age}
      </p>

      <button
        onClick={() => setShowAddModal(true)}
        className="mb-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Add New Record
      </button>

      <SearchFilterSort
        records={records}
        onFiltered={(filtered, keyword) => {
          setFilteredRecords(filtered);
          setSearchKeyword(keyword);
        }}
      />

      {/* SIMPLE NORMAL RENDER — NO VIRTUALIZATION */}
      <div className="bg-white p-6 rounded shadow-md max-h-[70vh] overflow-auto">
        {filteredRecords.length === 0 ? (
          <p>No records found.</p>
        ) : (
          filteredRecords.map((record) => (
            <RecordItem
              patientId={id}
              key={record._id}
              record={record}
              expandedRecordId={expandedRecordId}
              setExpandedRecordId={setExpandedRecordId}
              handleDelete={handleDeleteRecord}
              handleSaveEdit={handleSaveEdit}
              searchKeyword={searchKeyword}
            />
          ))
        )}
      </div>

      {showAddModal && (
        <Modal onClose={() => setShowAddModal(false)}>
          <h2 className="text-xl font-semibold mb-4">
            Add New Record
          </h2>

          <RecordForm
            patientId={id}
            recordData={newRecord}
            setRecordData={setNewRecord}
            onSubmit={async (e) => {
              e.preventDefault();
              const created = await handleAddRecord(newRecord);
              if (!created) return;

              setNewRecord(createEmptyRecord());

              setShowAddModal(false);
            }}
            submitLabel={addLoading ? "Adding..." : "Add Record"}
            loading={addLoading}
          />
        </Modal>
      )}
    </div>
  );
}
