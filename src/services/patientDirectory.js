import api from "./api";

const defaultOptionsCache = new Map();
const patientByIdCache = new Map();

export const getPatientPickerOptions = async ({
  search = "",
  limit = 20,
} = {}) => {
  const normalizedSearch = search.trim();
  const cacheKey = `${normalizedSearch}::${limit}`;

  if (!normalizedSearch && defaultOptionsCache.has(cacheKey)) {
    return defaultOptionsCache.get(cacheKey);
  }

  const response = await api.get("/patients/picker", {
    params: {
      search: normalizedSearch || undefined,
      limit,
    },
  });

  const options = Array.isArray(response.data) ? response.data : [];
  options.forEach((option) => {
    if (option?.id) {
      patientByIdCache.set(option.id, option);
    }
  });

  if (!normalizedSearch) {
    defaultOptionsCache.set(cacheKey, options);
  }

  return options;
};

export const getPatientPickerOptionById = async (id) => {
  if (!id) return null;

  if (patientByIdCache.has(id)) {
    return patientByIdCache.get(id);
  }

  const response = await api.get(`/patients/${id}`);
  const patient = response.data
    ? {
        id: response.data.id,
        name: response.data.name || "Unknown patient",
        cardNumber: response.data.cardNumber || "",
        phone: response.data.phone || "",
        email: response.data.email || "",
      }
    : null;

  if (patient?.id) {
    patientByIdCache.set(patient.id, patient);
  }

  return patient;
};
