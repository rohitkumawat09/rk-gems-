import axios from "axios";

// Environment variables
const localURL = import.meta.env.VITE_API_URL;
const renderURL = import.meta.env.VITE_RENDER_API_URL;

// Mode ke hisaab se base URL select karega
const baseURL =
  import.meta.env.MODE === "development"
    ? localURL
    : renderURL;

// Axios instance
const API = axios.create({
  baseURL: `${baseURL}/api/auth`,
  withCredentials: true, // HttpOnly cookies automatically sent with each request
});

// Response interceptor to handle token refresh
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't retry refresh endpoint itself to avoid infinite loops
    const isRefreshEndpoint = originalRequest.url === "/refresh";
    // Only attempt refresh for a single retry per request to avoid loops
    originalRequest._retryCount = originalRequest._retryCount || 0;

    if (
      error.response?.status === 401 &&
      originalRequest._retryCount < 1 &&
      !isRefreshEndpoint
    ) {
      originalRequest._retryCount += 1;

      console.log("AXIOS: 401 received for", originalRequest.url, "- attempting refresh (retryCount=", originalRequest._retryCount, ")");

      // Initialize single-flight state if needed
      if (!API._isRefreshing) {
        console.log("AXIOS: No refresh in progress - starting refresh");
        API._isRefreshing = true;
        API._refreshSubscribers = [];

        try {
          // Call refresh endpoint once
          const refreshResp = await API.post("/refresh");
          console.log("AXIOS: /refresh response ->", refreshResp.status, refreshResp.data?.success);
          API._isRefreshing = false;
          // resolve queued requests
          API._refreshSubscribers.forEach(cb => cb());
          API._refreshSubscribers = [];
          console.log("AXIOS: Refresh succeeded - retrying original request", originalRequest.url);
          return API(originalRequest);
        } catch (refreshError) {
          API._isRefreshing = false;
          API._refreshSubscribers = [];
          console.log("AXIOS: Refresh failed ->", refreshError?.response?.status || refreshError.message);
          // Refresh failed - propagate so caller can handle (logout, show login)
          return Promise.reject(refreshError);
        }
      }

      // If a refresh is already in progress, queue the retry
      console.log("AXIOS: Refresh already in progress - queueing request", originalRequest.url);
      return new Promise((resolve, reject) => {
        API._refreshSubscribers.push(() => {
          console.log("AXIOS: Retry callback - retrying original request after refresh", originalRequest.url);
          API(originalRequest).then(resolve).catch(reject);
        });
      });
    }

    return Promise.reject(error);
  }
);

export default API;
