import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { Platform } from "react-native";

const defaultHost = Platform.OS === "android" ? "http://10.0.2.2:8080" : "http://localhost:8080";
const rawBaseUrl = process.env.EXPO_PUBLIC_BACKEND_URL ?? defaultHost;
const trimmed = rawBaseUrl.endsWith("/") ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

export const BASE_URL = trimmed.endsWith("/api/v1") ? trimmed : `${trimmed}/api/v1`;

let _token: string | null = null;

export function setAuthToken(token: string | null) {
  _token = token;
}

export function getAuthToken() {
  return _token;
}

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (_token) {
    config.headers.set("Authorization", `Bearer ${_token}`);
  }

  return config;
});

export class ApiError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = "ApiError";
  }
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ detail?: string | Array<{ msg?: string }>; message?: string }>) => {
    const data = error.response?.data;
    let message = "Erro inesperado na API.";

    if (typeof data?.detail === "string") {
      message = data.detail;
    } else if (Array.isArray(data?.detail)) {
      message = data.detail.map((entry) => entry.msg ?? "Erro de validacao").join("; ");
    } else if (typeof data?.message === "string") {
      message = data.message;
    } else if (error.code === "ERR_NETWORK" || !error.response) {
      message = "Nao foi possivel conectar ao servidor.";
    } else if (typeof error.message === "string") {
      message = error.message;
    }

    return Promise.reject(new ApiError(message, error.response?.status));
  },
);
