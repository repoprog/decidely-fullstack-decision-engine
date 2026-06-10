import axios from "axios";
import { API_PATHS } from "../constants/apiConstants";
import { accessTokenStore } from "./accessTokenStore.js";

// Single-flight token refresh: parallel 401 responses share one refresh request.
let refreshPromise = null;

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = accessTokenStore.get();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const isRefreshRequest = originalRequest?.url?.includes(
      API_PATHS.AUTH.REFRESH,
    );

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isRefreshRequest
    ) {
      originalRequest._retry = true;

      if (!refreshPromise) {
        refreshPromise = axios
          .post(
            `${import.meta.env.VITE_API_URL}${API_PATHS.AUTH.REFRESH}`,
            {},
            { withCredentials: true },
          )
          .finally(() => {
            refreshPromise = null;
          });
      }

      try {
        const refreshResponse = await refreshPromise;
        const newAccessToken = refreshResponse.data.accessToken;

        accessTokenStore.set(newAccessToken);

        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return apiClient(originalRequest);
      } catch (refreshError) {
        accessTokenStore.clear();

        const { default: useAuthStore } = await import("../store/useAuthStore");

        useAuthStore.setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          isSessionInitialized: true,
        });

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
