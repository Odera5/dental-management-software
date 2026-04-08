// src/services/api.js
import axios from "axios";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api`,
});

let refreshPromise = null;

const clearAuthState = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const refreshToken = localStorage.getItem("refreshToken");
    const isAuthEndpoint = originalRequest?.url?.includes("/auth/login");
    const isRefreshEndpoint = originalRequest?.url?.includes("/auth/refresh-token");
    const shouldAttemptRefresh =
      refreshToken &&
      !originalRequest?._retry &&
      !isAuthEndpoint &&
      !isRefreshEndpoint &&
      error.response?.status === 401;

    if (shouldAttemptRefresh) {
      originalRequest._retry = true;

      try {
        refreshPromise =
          refreshPromise ||
          api.post("/auth/refresh-token", { refreshToken }).finally(() => {
            refreshPromise = null;
          });

        const response = await refreshPromise;
        const newAccessToken = response.data?.accessToken;

        if (!newAccessToken) {
          throw new Error("No refreshed access token returned");
        }

        localStorage.setItem("accessToken", newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        clearAuthState();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 401 || error.response?.status === 403) {
      clearAuthState();
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export const logoutCurrentUser = async () => {
  const refreshToken = localStorage.getItem("refreshToken");

  try {
    if (refreshToken) {
      await api.post("/auth/logout", { refreshToken });
    }
  } catch (error) {
    console.error("Logout request failed:", error);
  } finally {
    clearAuthState();
  }
};

export default api;
