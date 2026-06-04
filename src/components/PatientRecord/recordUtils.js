export const createEmptyRecord = () => ({
  presentingComplaint: "",
  history: "",
  examination: "",
  examinationExtraOral: "",
  softTissue: "",
  periodontalStatus: "",
  occlusion: "",
  investigation: "",
  diagnosis: "",
  treatmentPlan: "",
  medication: "",
  allergies: "",
  comorbidities: "",
  currentMedication: "",
  consentObtained: false,
  consentDate: "",
  consentTakenBy: "",
  consentNotes: "",
  dentition: "adult",
  teeth: [],
  attachments: [],
});

const CONDITION_LABELS = {
  present: "Present",
  carious: "Carious",
  tender: "Tender",
  mobile: "Mobile",
  fractured: "Fractured",
  missing: "Missing",
};

export const toothLabel = (num) => {
  const isChild = num >= 50;
  if (!isChild) {
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

export const palmerNotation = (num) => {
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

export const formatToothFindings = (teeth = [], dentition = "adult") => {
  if (!Array.isArray(teeth)) return [];

  const grouped = {};

  teeth.forEach((tooth) => {
    if (!tooth) return;

    const resolvedConditions = Array.isArray(tooth.conditions)
      ? tooth.conditions
      : tooth.condition && tooth.condition !== "present"
        ? [tooth.condition]
        : [];

    resolvedConditions.forEach((cond) => {
      if (!cond) return;

      if (!grouped[cond]) {
        grouped[cond] = [];
      }

      grouped[cond].push({
        number: tooth.number,
        label: toothLabel(tooth.number),
        notation: palmerNotation(tooth.number),
      });
    });
  });

  const findings = [];
  const sortedConditions = ["present", "carious", "tender", "mobile", "fractured", "missing"];

  sortedConditions.forEach((cond) => {
    if (grouped[cond] && grouped[cond].length > 0) {
      findings.push({
        condition: cond,
        label: cond === "present" ? "Teeth Present" : cond === "missing" ? "Missing Teeth" : CONDITION_LABELS[cond] || cond,
        teeth: grouped[cond],
      });
    }
  });

  return findings;
};

const imageExtensions = /\.(jpeg|jpg|png|gif|webp|bmp|svg)$/i;

export const isImageAttachment = (file) => {
  if (!file) return false;

  if (typeof file === "string") return imageExtensions.test(file);

  if (file instanceof File) return file.type.startsWith("image/");

  if (typeof file.mimetype === "string" && file.mimetype.startsWith("image/")) {
    return true;
  }

  return imageExtensions.test(file.name || file.url || "");
};

export const resolveAttachmentUrl = (url) => {
  if (!url) return "";
  if (/^blob:|^https?:\/\//i.test(url)) return url;

  const apiBase = import.meta.env.VITE_API_URL || "";
  return `${apiBase}${url.startsWith("/") ? url : `/${url}`}`;
};

export const normalizeAttachmentApiPath = (patientId, url) => {
  if (!url || !patientId) return url || "";
  if (!url.startsWith("/uploads/records/")) return url;

  const fileName = url.split("/").pop();
  return `/api/patients/${patientId}/records/attachments/${encodeURIComponent(fileName || "")}`;
};
