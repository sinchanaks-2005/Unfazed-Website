import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to attach JWT token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to catch 401s
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Do not redirect if already on login/signup/public pages
      const path = window.location.pathname;
      if (path.startsWith("/therapist/") && !path.includes("login") && !path.includes("signup")) {
        localStorage.removeItem("token");
        localStorage.removeItem("therapist");
        window.location.href = "/therapist/login";
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;

