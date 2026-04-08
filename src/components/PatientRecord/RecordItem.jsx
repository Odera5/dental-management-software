// src/components/PatientRecord/RecordItem.jsx
import React, { useState, useCallback, useEffect } from "react";
import api from "../../services/api";
import RecordForm from "./RecordForm";
import Modal from "./Modal";
import HighlightText from "../../utils/highlightText";
import {
  createEmptyRecord,
  formatToothFindings,
  isImageAttachment,
  normalizeAttachmentApiPath,
} from "./recordUtils";

function RecordItem({
  patientId,
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
  const [removedAttachments, setRemovedAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [attachmentUrls, setAttachmentUrls] = useState({});

  const isExpanded = expandedRecordId === record._id;

  useEffect(() => {
    if (virtualizer) {
      virtualizer.measure();
    }
  }, [isExpanded, virtualizer]);

  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    setEditingRecordData({ ...createEmptyRecord(), ...record });
    setRemovedAttachments([]);
    setLoading(false);
  }, [record]);

  const saveEdit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await handleSaveEdit(record._id, editingRecordData, removedAttachments);
      cancelEditing();
    } catch (err) {
      console.error("Failed to update record:", err);
      setLoading(false);
    }
  };

  const handleImageLoad = () => {
    if (virtualizer) {
      virtualizer.measure();
    }
  };

  useEffect(() => {
    if (!isExpanded || !record.attachments?.length) return undefined;

    let isCancelled = false;
    const objectUrls = [];

    const loadAttachments = async () => {
      try {
        const nextUrls = {};

        await Promise.all(
          record.attachments.map(async (file, index) => {
            const requestUrl = file?.url || file || "";
            const normalizedRequestUrl = normalizeAttachmentApiPath(
              patientId,
              requestUrl,
            );
            const attachmentKey = file?.name || requestUrl || `attachment-${index}`;

            if (!normalizedRequestUrl) return;

            const response = await api.get(normalizedRequestUrl, {
              responseType: "blob",
            });

            const objectUrl = URL.createObjectURL(response.data);
            objectUrls.push(objectUrl);
            nextUrls[attachmentKey] = objectUrl;
          }),
        );

        if (!isCancelled) {
          setAttachmentUrls(nextUrls);
        }
      } catch (error) {
        console.error("Failed to load attachment previews:", error);
      }
    };

    loadAttachments();

    return () => {
      isCancelled = true;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
      setAttachmentUrls({});
    };
  }, [isExpanded, patientId, record.attachments]);

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
        onClick={() => setExpandedRecordId(isExpanded ? null : record._id)}
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

          {record.attachments && record.attachments.length > 0 && (
            <div>
              <strong>Attachments:</strong>
              <div className="mt-1 grid grid-cols-2 md:grid-cols-4 gap-2">
                {record.attachments.map((file, idx) => {
                  const name = file?.name || file || "Attachment";
                  const requestUrl = file?.url || file || "";
                  const attachmentKey = file?.name || requestUrl || `attachment-${idx}`;
                  const url = attachmentUrls[attachmentKey] || "";
                  const isImage = isImageAttachment(file);

                  return isImage ? (
                    url ? (
                      <img
                        key={idx}
                        src={url}
                        alt={name}
                        onLoad={handleImageLoad}
                        className="w-full h-24 object-cover border rounded"
                      />
                    ) : (
                      <div
                        key={idx}
                        className="flex h-24 items-center justify-center rounded border bg-gray-100 text-xs text-gray-500"
                      >
                        Loading...
                      </div>
                    )
                  ) : (
                    <a
                      key={idx}
                      href={url || undefined}
                      download={name}
                      className="block p-2 border rounded bg-gray-100 text-sm truncate hover:bg-gray-200"
                      title={name}
                    >
                      [File] {name}
                    </a>
                  );
                })}
              </div>
            </div>
          )}

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
              onClick={() => handleDelete(record._id)}
              className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
            >
              Delete
            </button>
          </div>

          {isEditing && (
            <Modal onClose={cancelEditing}>
              <h2 className="text-xl font-semibold mb-4">Edit Record</h2>
              <RecordForm
                patientId={patientId}
                recordData={editingRecordData}
                setRecordData={setEditingRecordData}
                onSubmit={saveEdit}
                submitLabel="Save"
                loading={loading}
                onRemovedAttachmentsChange={setRemovedAttachments}
              />
            </Modal>
          )}
        </div>
      )}
    </div>
  );
}

export default React.memo(RecordItem);
