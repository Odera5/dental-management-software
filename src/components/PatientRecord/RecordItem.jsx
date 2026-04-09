// src/components/PatientRecord/RecordItem.jsx
import React, { useState, useCallback, useEffect } from "react";
import RecordForm from "./RecordForm";
import Modal from "./Modal";
import HighlightText from "../../utils/HighlightText";
import { createEmptyRecord, formatToothFindings } from "./recordUtils";
import { getEntityId } from "../../utils/entityId";

function RecordItem({
  record,
  expandedRecordId,
  setExpandedRecordId,
  handleDelete,
  handleSaveEdit,
  searchKeyword,
  virtualizer,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingRecordData, setEditingRecordData] = useState({
    ...createEmptyRecord(),
    ...record,
  });
  const [loading, setLoading] = useState(false);

  const recordId = getEntityId(record);
  const isExpanded = expandedRecordId === recordId;

  useEffect(() => {
    if (virtualizer) {
      virtualizer.measure();
    }
  }, [isExpanded, virtualizer]);

  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    setEditingRecordData({ ...createEmptyRecord(), ...record });
    setLoading(false);
  }, [record]);

  const saveEdit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await handleSaveEdit(recordId, editingRecordData, []);
      cancelEditing();
    } catch (err) {
      console.error("Failed to update record:", err);
      setLoading(false);
    }
  };

  const examSections = [
    ["Extra-Oral", record.examinationExtraOral],
    ["Soft Tissue", record.softTissue],
    ["Periodontal Status", record.periodontalStatus],
    ["Occlusion", record.occlusion],
  ].filter(([, value]) => value);

  const toothFindings = formatToothFindings(record.teeth, record.dentition);

  return (
    <div className="border rounded bg-gray-50 mb-2">
      <div
        onClick={() => setExpandedRecordId(isExpanded ? null : recordId)}
        className="flex justify-between items-center cursor-pointer px-4 py-2 bg-gray-200"
      >
        <span>
          <strong>Date:</strong>{" "}
          {record.createdAt ? new Date(record.createdAt).toLocaleDateString() : "-"} |{" "}
          <strong>Complaint:</strong>{" "}
          <HighlightText
            text={record.presentingComplaint || ""}
            keyword={searchKeyword}
          />{" "}
          | <strong>Diagnosis:</strong>{" "}
          <HighlightText text={record.diagnosis || ""} keyword={searchKeyword} />
        </span>
        <span>{isExpanded ? "^" : "v"}</span>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-3">
          <p>
            <strong>History:</strong>{" "}
            <HighlightText text={record.history || ""} keyword={searchKeyword} />
          </p>

          {examSections.length > 0 ? (
            <div className="space-y-1">
              <strong>Clinical Examination:</strong>
              {examSections.map(([label, value]) => (
                <p key={label}>
                  <span className="font-medium">{label}:</span>{" "}
                  <HighlightText text={value || ""} keyword={searchKeyword} />
                </p>
              ))}
            </div>
          ) : (
            <p>
              <strong>Examination:</strong>{" "}
              <HighlightText text={record.examination || ""} keyword={searchKeyword} />
            </p>
          )}

          {toothFindings.length > 0 && (
            <div className="space-y-1">
              <strong>Tooth Findings:</strong>
              <p className="text-sm text-gray-600">
                {record.dentition === "child" ? "Child" : "Adult"} dentition
              </p>
              {toothFindings.map((finding) => (
                <p key={finding.condition}>
                  <span className="font-medium">{finding.label}:</span>{" "}
                  {finding.teeth
                    .map((tooth) => tooth.notation)
                    .join(", ")}
                </p>
              ))}
            </div>
          )}

          <p>
            <strong>Investigation:</strong>{" "}
            <HighlightText text={record.investigation || ""} keyword={searchKeyword} />
          </p>

          <p>
            <strong>Treatment Plan:</strong>{" "}
            <HighlightText text={record.treatmentPlan || ""} keyword={searchKeyword} />
          </p>

          <p>
            <strong>Medication:</strong>{" "}
            <HighlightText text={record.medication || ""} keyword={searchKeyword} />
          </p>

          <p>
            <strong>Created At:</strong>{" "}
            {record.createdAt ? new Date(record.createdAt).toLocaleString() : "-"}
          </p>

          <div className="flex space-x-2 mt-2">
            <button
              onClick={() => setIsEditing(true)}
              className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
            >
              Edit
            </button>

            <button
              onClick={() => handleDelete(recordId)}
              className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
            >
              Delete
            </button>
          </div>

          {isEditing && (
            <Modal onClose={cancelEditing}>
              <h2 className="text-xl font-semibold mb-4">Edit Record</h2>
              <RecordForm
                recordData={editingRecordData}
                setRecordData={setEditingRecordData}
                onSubmit={saveEdit}
                submitLabel="Save"
                loading={loading}
              />
            </Modal>
          )}
        </div>
      )}
    </div>
  );
}

export default React.memo(RecordItem);
