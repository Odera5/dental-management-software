// src/components/PatientRecord/RecordForm.jsx
import React, { useState, useCallback } from "react";
import { createEmptyRecord } from "./recordUtils";

const ADULT_TEETH = [
  18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28, 48, 47, 46,
  45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38,
];
const CHILD_TEETH = [
  55, 54, 53, 52, 51, 61, 62, 63, 64, 65, 85, 84, 83, 82, 81, 71, 72, 73, 74,
  75,
];

const TOOTH_CONDITIONS = [
  "present",
  "carious",
  "tender",
  "mobile",
  "fractured",
  "missing",
];
const CONDITION_LABELS = {
  present: "Present",
  carious: "Carious",
  tender: "Tender",
  mobile: "Mobile",
  fractured: "Fractured",
  missing: "Missing",
};

const initTeeth = (nums) => nums.map((n) => ({ number: n, condition: "present" }));

const toothLabel = (num, dentition) => {
  if (dentition === "adult") {
    if (num >= 11 && num <= 18) return num - 10;
    if (num >= 21 && num <= 28) return num - 20;
    if (num >= 31 && num <= 38) return num - 30;
    if (num >= 41 && num <= 48) return num - 40;
  } else {
    const letters = ["A", "B", "C", "D", "E"];
    if (num >= 51 && num <= 55) return letters[num - 51];
    if (num >= 61 && num <= 65) return letters[num - 61];
    if (num >= 71 && num <= 75) return letters[num - 71];
    if (num >= 81 && num <= 85) return letters[num - 81];
  }
  return num;
};

const palmerNotation = (num) => {
  if (num >= 11 && num <= 18) return `UR${num - 10}`;
  if (num >= 21 && num <= 28) return `UL${num - 20}`;
  if (num >= 31 && num <= 38) return `LL${num - 30}`;
  if (num >= 41 && num <= 48) return `LR${num - 40}`;
  if (num >= 51 && num <= 55) return `UR${num - 50}`;
  if (num >= 61 && num <= 65) return `UL${num - 60}`;
  if (num >= 71 && num <= 75) return `LL${num - 70}`;
  if (num >= 81 && num <= 85) return `LR${num - 80}`;
  return `${num}`;
};

const initializeTeethState = (initialDentition, savedTeeth = []) => {
  const baseAdultTeeth = initTeeth(ADULT_TEETH);
  const baseChildTeeth = initTeeth(CHILD_TEETH);

  if (!Array.isArray(savedTeeth) || savedTeeth.length === 0) {
    return { adult: baseAdultTeeth, child: baseChildTeeth };
  }

  const savedConditions = new Map(
    savedTeeth.map((tooth) => [Number(tooth.number), tooth.condition || "present"]),
  );

  return {
    adult: baseAdultTeeth.map((tooth) => ({
      ...tooth,
      condition:
        initialDentition === "adult" && savedConditions.has(tooth.number)
          ? savedConditions.get(tooth.number)
          : tooth.condition,
    })),
    child: baseChildTeeth.map((tooth) => ({
      ...tooth,
      condition:
        initialDentition === "child" && savedConditions.has(tooth.number)
          ? savedConditions.get(tooth.number)
          : tooth.condition,
    })),
  };
};

function FormField({
  label,
  name,
  value,
  onChange,
  type = "text",
  rows = 1,
  required = false,
  placeholder = "",
}) {
  return (
    <div className="flex flex-col">
      <label className="font-semibold mb-1">{label}</label>
      {type === "textarea" ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          rows={rows}
          required={required}
          placeholder={placeholder}
          className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      ) : (
        <input
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      )}
    </div>
  );
}

function ToothChart({ teeth, onToothClick, dentition }) {
  const quadrants = {
    UR: teeth
      .filter((t) =>
        [11, 12, 13, 14, 15, 16, 17, 18, 51, 52, 53, 54, 55].includes(t.number),
      )
      .sort((a, b) => b.number - a.number),
    UL: teeth
      .filter((t) =>
        [21, 22, 23, 24, 25, 26, 27, 28, 61, 62, 63, 64, 65].includes(t.number),
      )
      .sort((a, b) => a.number - b.number),
    LL: teeth
      .filter((t) =>
        [31, 32, 33, 34, 35, 36, 37, 38, 71, 72, 73, 74, 75].includes(t.number),
      )
      .sort((a, b) => a.number - b.number),
    LR: teeth
      .filter((t) =>
        [41, 42, 43, 44, 45, 46, 47, 48, 81, 82, 83, 84, 85].includes(t.number),
      )
      .sort((a, b) => b.number - a.number),
  };

  const getToothClass = (condition) => {
    if (condition === "carious") return "bg-red-300";
    if (condition === "tender") return "bg-yellow-300";
    if (condition === "mobile") return "bg-orange-300";
    if (condition === "fractured") return "bg-purple-300";
    if (condition === "missing") return "bg-gray-400";
    return "bg-white";
  };

  const renderRow = (left, right) => (
    <div className="flex justify-between mb-1">
      <div className="flex gap-1">
        {left.map((t) => (
          <button
            key={t.number}
            type="button"
            onClick={() => onToothClick(t.number)}
            className={`w-8 h-8 border rounded text-xs flex items-center justify-center cursor-pointer ${getToothClass(
              t.condition,
            )}`}
            title={`${palmerNotation(t.number)} - ${CONDITION_LABELS[t.condition]}`}
          >
            {toothLabel(t.number, dentition)}
          </button>
        ))}
      </div>
      <div className="flex gap-1">
        {right.map((t) => (
          <button
            key={t.number}
            type="button"
            onClick={() => onToothClick(t.number)}
            className={`w-8 h-8 border rounded text-xs flex items-center justify-center cursor-pointer ${getToothClass(
              t.condition,
            )}`}
            title={`${palmerNotation(t.number)} - ${CONDITION_LABELS[t.condition]}`}
          >
            {toothLabel(t.number, dentition)}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm font-semibold mb-1">
        <span>Left</span>
        <span>Right</span>
      </div>
      <div className="text-xs text-center mb-1 font-semibold">Upper</div>
      {renderRow(quadrants.UL, quadrants.UR)}
      <div className="text-xs text-center mt-2 mb-1 font-semibold">Lower</div>
      {renderRow(quadrants.LL, quadrants.LR)}
    </div>
  );
}

const groupByQuadrant = (teeth, dentition) => {
  const quads = { UR: [], UL: [], LL: [], LR: [] };
  teeth.forEach((num) => {
    const label = toothLabel(num, dentition);
    const notation = palmerNotation(num).slice(0, 2);
    if (quads[notation]) quads[notation].push(label);
  });
  return quads;
};

export default function RecordForm({
  recordData,
  setRecordData,
  onSubmit,
  submitLabel,
  loading,
}) {
  const [activeExamTab, setActiveExamTab] = useState("extraoral");

  const initialRecord = { ...createEmptyRecord(), ...recordData };
  const initialTeethState = initializeTeethState(
    initialRecord.dentition,
    initialRecord.teeth,
  );

  const [dentition, setDentition] = useState(initialRecord.dentition || "adult");
  const [activeCondition, setActiveCondition] = useState("carious");
  const [adultTeeth, setAdultTeeth] = useState(initialTeethState.adult);
  const [childTeeth, setChildTeeth] = useState(initialTeethState.child);

  const teeth = dentition === "adult" ? adultTeeth : childTeeth;
  const setTeeth = dentition === "adult" ? setAdultTeeth : setChildTeeth;

  const syncRecordTeeth = useCallback(
    (nextDentition, nextTeeth) => {
      setRecordData((prev) => ({
        ...prev,
        dentition: nextDentition,
        teeth: nextTeeth,
      }));
    },
    [setRecordData],
  );

  const handleToothClick = useCallback(
    (num) => {
      setTeeth((prev) => {
        const updatedTeeth = prev.map((t) =>
          t.number === num
            ? {
                ...t,
                condition:
                  t.condition === activeCondition ? "present" : activeCondition,
              }
            : t,
        );

        syncRecordTeeth(dentition, updatedTeeth);
        return updatedTeeth;
      });
    },
    [activeCondition, dentition, setTeeth, syncRecordTeeth],
  );

  const getAffectedTeethByQuadrant = (condition) => {
    const affected = teeth
      .filter((t) => t.condition === condition)
      .map((t) => t.number);
    return groupByQuadrant(affected, dentition);
  };

  const handleChange = (e) =>
    setRecordData({ ...recordData, [e.target.name]: e.target.value });

  const handleReset = () => {
    const emptyRecord = createEmptyRecord();
    const emptyTeethState = initializeTeethState("adult", []);

    setRecordData(emptyRecord);
    setDentition("adult");
    setAdultTeeth(emptyTeethState.adult);
    setChildTeeth(emptyTeethState.child);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="p-4 border rounded shadow-sm bg-white">
        <h2 className="font-bold mb-3 text-lg">Presenting Complaint & History</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Presenting Complaint"
            name="presentingComplaint"
            value={recordData.presentingComplaint}
            onChange={handleChange}
            type="textarea"
            rows={3}
            required
          />
          <FormField
            label="History of Presenting Complaint"
            name="history"
            value={recordData.history}
            onChange={handleChange}
            type="textarea"
            rows={3}
          />
        </div>

        <div className="mt-4">
          <h2 className="font-bold mb-3 text-lg">Clinical Examination</h2>
          <div className="flex gap-4 border-b mb-4">
            <button
              type="button"
              className={`py-1 px-3 ${
                activeExamTab === "extraoral"
                  ? "border-b-2 border-blue-600 font-semibold"
                  : ""
              }`}
              onClick={() => setActiveExamTab("extraoral")}
            >
              Extra-Oral
            </button>
            <button
              type="button"
              className={`py-1 px-3 ${
                activeExamTab === "intraoral"
                  ? "border-b-2 border-blue-600 font-semibold"
                  : ""
              }`}
              onClick={() => setActiveExamTab("intraoral")}
            >
              Intra-Oral
            </button>
          </div>

          {activeExamTab === "extraoral" && (
            <FormField
              label="Extra-Oral Examination"
              name="examinationExtraOral"
              value={recordData.examinationExtraOral || ""}
              onChange={handleChange}
              type="textarea"
              rows={3}
            />
          )}

          {activeExamTab === "intraoral" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <FormField
                  label="Soft Tissue Examination"
                  name="softTissue"
                  value={recordData.softTissue || ""}
                  onChange={handleChange}
                  type="textarea"
                  rows={3}
                  placeholder="Mucosa, tongue, floor of mouth, palate, gingiva..."
                />
                <FormField
                  label="Periodontal Status"
                  name="periodontalStatus"
                  value={recordData.periodontalStatus || ""}
                  onChange={handleChange}
                  type="textarea"
                  rows={3}
                  placeholder="Gingival condition, pocket depth, bleeding on probing..."
                />
              </div>
              <div className="mb-4">
                <FormField
                  label="Occlusion"
                  name="occlusion"
                  value={recordData.occlusion || ""}
                  onChange={handleChange}
                  type="textarea"
                  rows={3}
                  placeholder="Class I / II / III, overjet, overbite, crossbite..."
                />
              </div>

              <div className="mt-4 p-4 border rounded shadow-sm bg-white">
                <h2 className="font-bold mb-3 text-lg">Tooth Chart</h2>
                <div className="flex items-center gap-4 mb-2">
                  <select
                    value={dentition}
                    onChange={(e) => {
                      const nextDentition = e.target.value;
                      const nextTeeth =
                        nextDentition === "adult" ? adultTeeth : childTeeth;
                      setDentition(nextDentition);
                      syncRecordTeeth(nextDentition, nextTeeth);
                    }}
                    className="border rounded p-1"
                  >
                    <option value="adult">Adult (32)</option>
                    <option value="child">Child (20)</option>
                  </select>
                  <span className="text-sm">Active condition:</span>
                  {TOOTH_CONDITIONS.filter((c) => c !== "present").map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setActiveCondition(c)}
                      className={`px-2 py-1 text-xs rounded border ${
                        activeCondition === c ? "bg-blue-600 text-white" : "bg-white"
                      }`}
                    >
                      {CONDITION_LABELS[c]}
                    </button>
                  ))}
                </div>

                <ToothChart
                  teeth={teeth}
                  onToothClick={handleToothClick}
                  dentition={dentition}
                />

                <div className="mt-2 text-sm">
                  {TOOTH_CONDITIONS.filter((c) => c !== "present").map((c) => {
                    const grouped = getAffectedTeethByQuadrant(c);
                    if (!Object.values(grouped).some((q) => q.length > 0)) return null;

                    return (
                      <div key={c}>
                        <strong>{CONDITION_LABELS[c]}:</strong>
                        {["UL", "UR", "LL", "LR"].map(
                          (q) =>
                            grouped[q].length > 0 && (
                              <div key={q} className="ml-2">
                                {q}: {grouped[q].join(", ")}
                              </div>
                            ),
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="p-4 border rounded shadow-sm bg-white">
        <div className="mb-4">
          <h2 className="font-bold text-lg">Assessment & Plan</h2>
          <p className="text-sm text-gray-600">
            Capture the working diagnosis, investigations, treatment plan, and medications.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Investigation"
            name="investigation"
            value={recordData.investigation}
            onChange={handleChange}
            type="textarea"
            rows={2}
          />
          <FormField
            label="Diagnosis"
            name="diagnosis"
            value={recordData.diagnosis}
            onChange={handleChange}
            type="textarea"
            rows={2}
            required
          />
          <FormField
            label="Treatment Plan"
            name="treatmentPlan"
            value={recordData.treatmentPlan}
            onChange={handleChange}
            type="textarea"
            rows={2}
            required
          />
          <FormField
            label="Medication"
            name="medication"
            value={recordData.medication}
            onChange={handleChange}
            type="textarea"
            rows={2}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleReset}
          className="flex-1 bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
        >
          Reset
        </button>
        <button
          type="submit"
          disabled={loading}
          className={`flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 ${
            loading ? "bg-blue-300 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
