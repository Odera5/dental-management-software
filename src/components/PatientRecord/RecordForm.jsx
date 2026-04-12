import React, { useState, useCallback } from "react";
import { createEmptyRecord } from "./recordUtils";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { CheckCircle2, Shield, AlertCircle } from "lucide-react";

const ADULT_TEETH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28, 48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
const CHILD_TEETH = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65, 85, 84, 83, 82, 81, 71, 72, 73, 74, 75];

const TOOTH_CONDITIONS = ["present", "carious", "tender", "mobile", "fractured", "missing"];
const CONDITION_LABELS = { present: "Present", carious: "Carious", tender: "Tender", mobile: "Mobile", fractured: "Fractured", missing: "Missing" };

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

  if (!Array.isArray(savedTeeth) || savedTeeth.length === 0) return { adult: baseAdultTeeth, child: baseChildTeeth };

  const savedConditions = new Map(savedTeeth.map((tooth) => [Number(tooth.number), tooth.condition || "present"]));

  return {
    adult: baseAdultTeeth.map((tooth) => ({ ...tooth, condition: initialDentition === "adult" && savedConditions.has(tooth.number) ? savedConditions.get(tooth.number) : tooth.condition })),
    child: baseChildTeeth.map((tooth) => ({ ...tooth, condition: initialDentition === "child" && savedConditions.has(tooth.number) ? savedConditions.get(tooth.number) : tooth.condition })),
  };
};

function FormField({ label, name, value, onChange, type = "text", rows = 1, required = false, placeholder = "" }) {
  return (
    <div className="space-y-1.5 focus-within:text-primary-600 transition-colors">
      <label className="text-sm font-semibold text-slate-700 leading-none">{label} {required && <span className="text-red-500">*</span>}</label>
      {type === "textarea" ? (
        <textarea name={name} value={value} onChange={onChange} rows={rows} required={required} placeholder={placeholder} className="w-full rounded-xl border border-slate-200 p-3 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm resize-none transition-shadow" />
      ) : (
        <input name={name} type={type} value={value} onChange={onChange} required={required} placeholder={placeholder} className="w-full rounded-xl border border-slate-200 p-3 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm transition-shadow h-[46px]" />
      )}
    </div>
  );
}

function CheckboxField({ label, name, checked, onChange }) {
  return (
    <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 cursor-pointer hover:bg-slate-50 transition-colors shadow-sm focus-within:ring-2 focus-within:ring-primary-500">
      <div className="relative flex items-center">
        <input type="checkbox" name={name} checked={checked} onChange={onChange} className="h-5 w-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer" />
      </div>
      <span className="font-semibold text-slate-800 select-none flex-1">{label}</span>
    </label>
  );
}

function ToothChart({ teeth, onToothClick, dentition }) {
  const quadrants = {
    UR: teeth.filter((t) => [11, 12, 13, 14, 15, 16, 17, 18, 51, 52, 53, 54, 55].includes(t.number)).sort((a, b) => b.number - a.number),
    UL: teeth.filter((t) => [21, 22, 23, 24, 25, 26, 27, 28, 61, 62, 63, 64, 65].includes(t.number)).sort((a, b) => a.number - b.number),
    LL: teeth.filter((t) => [31, 32, 33, 34, 35, 36, 37, 38, 71, 72, 73, 74, 75].includes(t.number)).sort((a, b) => a.number - b.number),
    LR: teeth.filter((t) => [41, 42, 43, 44, 45, 46, 47, 48, 81, 82, 83, 84, 85].includes(t.number)).sort((a, b) => b.number - a.number),
  };

  const getToothClass = (condition) => {
    if (condition === "carious") return "bg-rose-500 text-white border-rose-600 ring-2 ring-rose-500 ring-offset-1";
    if (condition === "tender") return "bg-amber-400 text-amber-900 border-amber-500 ring-2 ring-amber-400 ring-offset-1";
    if (condition === "mobile") return "bg-orange-400 text-white border-orange-500 ring-2 ring-orange-400 ring-offset-1";
    if (condition === "fractured") return "bg-purple-500 text-white border-purple-600 ring-2 ring-purple-500 ring-offset-1";
    if (condition === "missing") return "bg-slate-300 text-slate-500 border-slate-400 opacity-60 line-through";
    return "bg-white text-slate-700 border-slate-300 hover:bg-slate-100";
  };

  const renderRow = (left, right) => (
    <div className="flex justify-center md:justify-between items-center w-full max-w-2xl mx-auto flex-wrap md:flex-nowrap gap-4 md:gap-8 mb-2">
      <div className="flex gap-1.5 flex-1 justify-center md:justify-end border-b-2 border-slate-300 pb-2 md:border-b-0 md:pb-0 md:border-r-2 md:pr-4">
        {left.map((t) => (
          <button key={t.number} type="button" onClick={() => onToothClick(t.number)} className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg text-sm font-bold flex items-center justify-center cursor-pointer transition-all hover:-translate-y-1 ${getToothClass(t.condition)}`} title={`${palmerNotation(t.number)} - ${CONDITION_LABELS[t.condition]}`}>{toothLabel(t.number, dentition)}</button>
        ))}
      </div>
      <div className="flex gap-1.5 flex-1 justify-center md:justify-start border-t-2 border-slate-300 pt-2 md:border-t-0 md:pt-0">
        {right.map((t) => (
          <button key={t.number} type="button" onClick={() => onToothClick(t.number)} className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg text-sm font-bold flex items-center justify-center cursor-pointer transition-all hover:-translate-y-1 ${getToothClass(t.condition)}`} title={`${palmerNotation(t.number)} - ${CONDITION_LABELS[t.condition]}`}>{toothLabel(t.number, dentition)}</button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-4 py-6 bg-slate-50 rounded-2xl border border-slate-200 shadow-inner">
      <div className="flex justify-between w-full max-w-2xl mx-auto px-4">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-white px-2 py-0.5 rounded border border-slate-200">Patient's Right (UR/LR)</span>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-white px-2 py-0.5 rounded border border-slate-200">Patient's Left (UL/LL)</span>
      </div>
      <div className="text-center"><span className="inline-block bg-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-widest px-4 py-1 rounded-full mb-2">Maxillary (Upper)</span></div>
      {renderRow(quadrants.UR, quadrants.UL)}
      
      <div className="w-full max-w-2xl mx-auto border-t-2 border-slate-300 border-dashed my-4"></div>
      
      {renderRow(quadrants.LR, quadrants.LL)}
      <div className="text-center mt-2"><span className="inline-block bg-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-widest px-4 py-1 rounded-full">Mandibular (Lower)</span></div>
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

export default function RecordForm({ recordData, setRecordData, onSubmit, submitLabel, loading }) {
  const [activeExamTab, setActiveExamTab] = useState("extraoral");

  const initialRecord = { ...createEmptyRecord(), ...recordData };
  const initialTeethState = initializeTeethState(initialRecord.dentition, initialRecord.teeth);

  const [dentition, setDentition] = useState(initialRecord.dentition || "adult");
  const [activeCondition, setActiveCondition] = useState("carious");
  const [adultTeeth, setAdultTeeth] = useState(initialTeethState.adult);
  const [childTeeth, setChildTeeth] = useState(initialTeethState.child);

  const teeth = dentition === "adult" ? adultTeeth : childTeeth;
  const setTeeth = dentition === "adult" ? setAdultTeeth : setChildTeeth;

  const syncRecordTeeth = useCallback((nextDentition, nextTeeth) => {
    setRecordData((prev) => ({ ...prev, dentition: nextDentition, teeth: nextTeeth }));
  }, [setRecordData]);

  const handleToothClick = useCallback((num) => {
    setTeeth((prev) => {
      const updatedTeeth = prev.map((t) => t.number === num ? { ...t, condition: t.condition === activeCondition ? "present" : activeCondition } : t);
      syncRecordTeeth(dentition, updatedTeeth);
      return updatedTeeth;
    });
  }, [activeCondition, dentition, setTeeth, syncRecordTeeth]);

  const getAffectedTeethByQuadrant = (condition) => {
    const affected = teeth.filter((t) => t.condition === condition).map((t) => t.number);
    return groupByQuadrant(affected, dentition);
  };

  const handleChange = (e) => setRecordData({ ...recordData, [e.target.name]: e.target.value });

  const handleCheckboxChange = (e) => setRecordData({ ...recordData, [e.target.name]: e.target.checked, ...(e.target.name === "consentObtained" && !e.target.checked ? { consentDate: "", consentTakenBy: "", consentNotes: "" } : {}) });

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
      <div className="p-6 border border-slate-200 rounded-2xl shadow-sm bg-white">
        <h2 className="font-bold mb-4 text-lg text-slate-900 border-b border-slate-100 pb-2 flex items-center">Case History</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Presenting Complaint" name="presentingComplaint" value={recordData.presentingComplaint} onChange={handleChange} type="textarea" rows={3} required placeholder="C/O..." />
          <FormField label="History of Presenting Complaint" name="history" value={recordData.history} onChange={handleChange} type="textarea" rows={3} placeholder="HPC..." />
        </div>
      </div>

      <div className="p-6 border border-slate-200 rounded-2xl shadow-sm bg-white">
        <h2 className="font-bold mb-4 text-lg text-slate-900 border-b border-slate-100 pb-2 flex items-center">Clinical Examination</h2>
        <div className="flex gap-2 border-b border-slate-200 mb-6 pb-2">
          <button type="button" className={`py-2 px-4 rounded-lg text-sm font-bold transition-colors ${activeExamTab === "extraoral" ? "bg-primary-50 text-primary-700" : "text-slate-500 hover:bg-slate-50"}`} onClick={() => setActiveExamTab("extraoral")}>Extra-Oral</button>
          <button type="button" className={`py-2 px-4 rounded-lg text-sm font-bold transition-colors ${activeExamTab === "intraoral" ? "bg-primary-50 text-primary-700" : "text-slate-500 hover:bg-slate-50"}`} onClick={() => setActiveExamTab("intraoral")}>Intra-Oral & Chart</button>
        </div>

        {activeExamTab === "extraoral" && (
          <FormField label="Extra-Oral Examination Notes" name="examinationExtraOral" value={recordData.examinationExtraOral || ""} onChange={handleChange} type="textarea" rows={4} placeholder="Facial symmetry, TMJ, lymph nodes..." />
        )}

        {activeExamTab === "intraoral" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <FormField label="Soft Tissue Findings" name="softTissue" value={recordData.softTissue || ""} onChange={handleChange} type="textarea" rows={3} placeholder="Mucosa, tongue, palate..." />
              <FormField label="Periodontal Status" name="periodontalStatus" value={recordData.periodontalStatus || ""} onChange={handleChange} type="textarea" rows={3} placeholder="Gingival condition, B.O.P..." />
            </div>
            <div className="mb-8">
              <FormField label="Occlusion" name="occlusion" value={recordData.occlusion || ""} onChange={handleChange} type="textarea" rows={2} placeholder="Class I/II/III..." />
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-col lg:flex-row justify-between items-center gap-4">
                <div>
                   <h3 className="font-bold text-slate-900 text-lg">Dental Chart</h3>
                   <p className="text-xs text-slate-500">Click a condition below, then select teeth on the chart.</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                  <select value={dentition} onChange={(e) => { const next = e.target.value; setDentition(next); syncRecordTeeth(next, next === "adult" ? adultTeeth : childTeeth); }} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-primary-700 shadow-sm focus:ring-2 focus:ring-primary-500 h-[40px]">
                    <option value="adult">Adult Dentition (32)</option>
                    <option value="child">Child Dentition (20)</option>
                  </select>

                  <div className="flex bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-1">
                    {TOOTH_CONDITIONS.filter((c) => c !== "present").map((c) => (
                      <button key={c} type="button" onClick={() => setActiveCondition(c)} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activeCondition === c ? "bg-slate-800 text-white shadow-md transform scale-105" : "text-slate-600 hover:bg-slate-100"}`}>{CONDITION_LABELS[c]}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6">
                <ToothChart teeth={teeth} onToothClick={handleToothClick} dentition={dentition} />

                <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {TOOTH_CONDITIONS.filter((c) => c !== "present").map((c) => {
                    const grouped = getAffectedTeethByQuadrant(c);
                    if (!Object.values(grouped).some((q) => q.length > 0)) return null;
                    return (
                      <div key={c} className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-sm">
                        <strong className="block text-slate-900 mb-2 uppercase tracking-wide text-xs border-b border-slate-200 pb-1">{CONDITION_LABELS[c]} Affected</strong>
                        <div className="space-y-1">
                          {["UR", "UL", "LR", "LL"].map((q) => grouped[q].length > 0 && (
                            <div key={q} className="flex justify-between"><span className="text-slate-500 font-semibold text-xs">{q}</span><span className="font-mono text-slate-900 font-bold">{grouped[q].join(", ")}</span></div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 border border-slate-200 rounded-2xl shadow-sm bg-white">
        <h2 className="font-bold mb-4 text-lg text-slate-900 border-b border-slate-100 pb-2 flex items-center">Assessment & Plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Diagnosis" name="diagnosis" value={recordData.diagnosis} onChange={handleChange} type="textarea" rows={3} required placeholder="Definitive or provisional diagnosis..." />
          <FormField label="Treatment Plan" name="treatmentPlan" value={recordData.treatmentPlan} onChange={handleChange} type="textarea" rows={3} required placeholder="Proposed procedures..." />
          <FormField label="Investigations Ordered" name="investigation" value={recordData.investigation} onChange={handleChange} type="textarea" rows={2} placeholder="X-rays, lab tests..." />
          <FormField label="Medications Prescribed" name="medication" value={recordData.medication} onChange={handleChange} type="textarea" rows={2} placeholder="Prescriptions..." />
        </div>
      </div>

      <div className="p-6 border border-slate-200 rounded-2xl shadow-sm bg-gradient-to-br from-slate-50 to-white">
        <h2 className="font-bold mb-4 text-lg text-slate-900 border-b border-slate-200 pb-2 flex items-center"><Shield size={20} className="mr-2 text-slate-400" /> Informed Consent</h2>
        
        <div className="space-y-6">
          <CheckboxField label="I confirm that informed consent was obtained from the patient (or guardian) before commencing treatment." name="consentObtained" checked={Boolean(recordData.consentObtained)} onChange={handleCheckboxChange} />

          {recordData.consentObtained && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-xl border border-emerald-100 animate-in fade-in zoom-in-95 duration-200">
              <FormField label="Date Obtained" name="consentDate" type="datetime-local" value={recordData.consentDate || ""} onChange={handleChange} />
              <FormField label="Takes By (Clinician)" name="consentTakenBy" value={recordData.consentTakenBy || ""} onChange={handleChange} placeholder="Dr. Name" />
              <div className="md:col-span-2">
                <FormField label="Consent Details (Optional)" name="consentNotes" value={recordData.consentNotes || ""} onChange={handleChange} type="textarea" rows={2} placeholder="Verbal consent obtained after discussing risks and alternatives..." />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-200">
        <Button type="button" variant="ghost" onClick={handleReset} className="w-full sm:w-auto">Reset Form</Button>
        <div className="flex-1"></div>
        <Button type="submit" isLoading={loading} size="lg" className="w-full sm:w-auto shadow-md">{submitLabel}</Button>
      </div>
    </form>
  );
}
