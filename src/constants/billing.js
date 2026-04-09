export const DEFAULT_PROCEDURE_PRESETS = [
  { description: "Consultation", category: "service", unitPrice: 5000 },
  { description: "Scaling and Polishing", category: "procedure", unitPrice: 15000 },
  { description: "Tooth Extraction", category: "procedure", unitPrice: 12000 },
  { description: "Dental Filling", category: "procedure", unitPrice: 10000 },
  { description: "Root Canal Treatment", category: "procedure", unitPrice: 45000 },
  { description: "Dental X-Ray", category: "lab", unitPrice: 8000 },
  { description: "Medication Dispensing", category: "medication", unitPrice: 3500 },
];

export const normalizeProcedurePresets = (value) => {
  const incoming =
    Array.isArray(value) && value.length > 0 ? value : DEFAULT_PROCEDURE_PRESETS;

  return DEFAULT_PROCEDURE_PRESETS.map((fallback, index) => {
    const preset = incoming[index] || fallback;
    const unitPrice = Number(preset?.unitPrice);

    return {
      description: preset?.description || fallback.description,
      category: preset?.category || fallback.category,
      unitPrice: Number.isFinite(unitPrice) && unitPrice >= 0 ? unitPrice : fallback.unitPrice,
    };
  });
};

export const formatNaira = (value) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(Number(value) || 0);
