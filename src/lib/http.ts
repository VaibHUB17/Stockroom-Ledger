import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { getToken, clearSession } from "./auth-storage";
import { AppError } from "./types";

export const http = axios.create({
  baseURL: "https://dummyjson.com",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach bearer token if present
http.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => Promise.reject(error)
);

// Normalise all errors into AppError shape
http.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    // Silently ignore aborted / cancelled requests
    if (axios.isCancel(error)) {
      const canceledError: AppError = {
        message: "Request aborted",
        isCanceled: true,
      };
      return Promise.reject(canceledError);
    }

    const status = error.response?.status;
    const serverMessage = error.response?.data?.message;

    // Handle session expiry or unauthorized request
    if (status === 401) {
      clearSession();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }

    const appError: AppError = {
      status,
      message:
        serverMessage ||
        (status === 404
          ? "The requested item was not found."
          : error.message || "Could not complete request. Check your connection and retry."),
      isCanceled: false,
    };

    return Promise.reject(appError);
  }
);
