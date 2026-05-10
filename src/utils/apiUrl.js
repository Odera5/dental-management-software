const DEFAULT_API_URL = "http://localhost:5000";

export const normalizeApiUrl = (value) => {
  const rawValue = String(value || "").trim();
  if (!rawValue) return DEFAULT_API_URL;

  if (/^https?:\/\//i.test(rawValue)) {
    return rawValue.replace(/\/$/, "");
  }

  return `https://${rawValue.replace(/\/$/, "")}`;
};

export const getApiOrigin = () =>
  normalizeApiUrl(import.meta.env.VITE_API_URL).replace(/\/api\/?$/, "");
