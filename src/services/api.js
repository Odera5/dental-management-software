// src/services/api.js
import axios from "axios";
import {
  clearAuthState,
  getStoredUser,
} from "../utils/authStorage";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api`,
  withCredentials: true,
});

let refreshPromise = null;

api.interceptors.request.use((config) => {
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
        refreshPromise =
          refreshPromise ||
          api.post("/auth/refresh-token", {}).finally(() => {
            refreshPromise = null;
          });

        const response = await refreshPromise;

        // The new token is set via httpOnly cookie, just retry the request
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
    await api.post("/auth/logout", {});
  } catch (error) {
    console.error("Logout request failed:", error);
  } finally {
    clearAuthState();
  }
};

export default api;
