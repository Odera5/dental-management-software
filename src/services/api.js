// src/services/api.js
import axios from "axios";
import {
  clearAuthState,
  getStoredAccessToken,
  getStoredRefreshToken,
  getStoredUser,
  updateStoredAccessToken,
} from "../utils/authStorage";
import { getActiveBranchId } from "../utils/branchStorage";
import { clearLastVisitedRoute } from "../utils/persistence";
import { normalizeApiUrl } from "../utils/apiUrl";

const api = axios.create({
  baseURL: `${normalizeApiUrl(import.meta.env.VITE_API_URL)}/api`,
  withCredentials: true,
});

let refreshPromise = null;

api.interceptors.request.use((config) => {
  const branchId = getActiveBranchId();
  const accessToken = getStoredAccessToken();

  if (branchId) {
    config.headers = {
      ...(config.headers || {}),
      "x-branch-id": branchId,
    };
  }

  if (accessToken) {
    config.headers = {
      ...(config.headers || {}),
      Authorization: `Bearer ${accessToken}`,
    };
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const hasUser = !!getStoredUser();
    const isAuthEndpoint = originalRequest?.url?.includes("/auth/login");
    const isRefreshEndpoint = originalRequest?.url?.includes("/auth/refresh-token");
    const shouldAttemptRefresh =
      hasUser &&
      !originalRequest?._retry &&
      !isAuthEndpoint &&
      !isRefreshEndpoint &&
      error.response?.status === 401;

    if (shouldAttemptRefresh) {
      originalRequest._retry = true;

      try {
        const refreshToken = getStoredRefreshToken();
        refreshPromise =
          refreshPromise ||
          api
            .post("/auth/refresh-token", refreshToken ? { refreshToken } : {})
            .then((response) => {
              const newAccessToken = response.data?.accessToken;
              if (newAccessToken) {
                updateStoredAccessToken(newAccessToken);
              }
              return response;
            })
            .finally(() => {
              refreshPromise = null;
            });

        await refreshPromise;

        return api(originalRequest);
      } catch (refreshError) {
        clearAuthState();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    if (
      error.response?.status === 403 &&
      ["SUBSCRIPTION_EXPIRED", "UPGRADE_REQUIRED"].includes(
        error.response?.data?.errorCode,
      ) &&
      !isAuthEndpoint &&
      !isRefreshEndpoint
    ) {
      let user = null;

      try {
        user = JSON.parse(getStoredUser() || "null");
      } catch {
        user = null;
      }

      if (user?.role === "admin") {
        if (window.location.pathname !== "/upgrade") {
          window.location.href = "/upgrade";
        }
      } else {
        clearAuthState();
        window.location.href = "/login";
      }
    }

    if (
      error.response?.status === 401 &&
      !isAuthEndpoint &&
      !isRefreshEndpoint
    ) {
      clearAuthState();
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export const logoutCurrentUser = async () => {
  try {
    const refreshToken = getStoredRefreshToken();
    await api.post("/auth/logout", refreshToken ? { refreshToken } : {});
  } catch (error) {
    console.error("Logout request failed:", error);
  } finally {
    clearLastVisitedRoute();
    clearAuthState();
  }
};

export default api;
