import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

if (!API_BASE_URL) {
  console.error("VITE_API_URL is not defined in environment variables");
  throw new Error("API configuration error: VITE_API_URL is not defined");
}

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("ACCESS_TOKEN");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // add workspace id to the request
  const workspaceId = sessionStorage.getItem("ACTIVE_WORKSPACE_ID");
  if (workspaceId) {
    config.headers["x-workspace-id"] = workspaceId;
  }

  return config;
});

export default api;
