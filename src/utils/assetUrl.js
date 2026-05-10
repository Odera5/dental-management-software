import { getApiOrigin } from "./apiUrl";

const apiOrigin = getApiOrigin().replace(/\/$/, "");

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
