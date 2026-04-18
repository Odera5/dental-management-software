const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
const apiOrigin = rawApiUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");

export const resolveAssetUrl = (url) => {
  if (!url) return "";

  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("//") ||
    url.startsWith("data:") ||
    url.startsWith("blob:")
  ) {
    return url;
  }

  return `${apiOrigin}${url.startsWith("/") ? url : `/${url}`}`;
};
