/**
 * api.ts — Instância central do Axios.
 *
 * - baseURL lida do EXPO_PUBLIC_BACKEND_URL (definido em .env)
 * - Token JWT armazenado em memória e injetado automaticamente via interceptor síncrono
 * - Interceptor de response normaliza erros da API em ApiError
 */
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import Constants from "expo-constants";

// ─── Base URL ─────────────────────────────────────────────────────────────────

const appConfig = Constants.expoConfig;
const fallbackUrl = process.env.EXPO_PUBLIC_BACKEND_URL ?? "http://localhost:8080";
const rawBaseUrl =
  (appConfig?.extra?.EXPO_PUBLIC_BACKEND_URL as string | undefined) ?? fallbackUrl;

function buildBaseUrl(url: string): string {
  const trimmed = url.endsWith("/") ? url.slice(0, -1) : url;
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
}

export const BASE_URL = buildBaseUrl(rawBaseUrl);

// ─── Token em memória ─────────────────────────────────────────────────────────
// Definido pelo index.tsx após login ou restauração de sessão.

let _token: string | null = null;

export function setAuthToken(token: string | null) {
  _token = token;
}

// ─── Instância Axios ──────────────────────────────────────────────────────────

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// ─── Interceptor de request: injeta token JWT (síncrono) ─────────────────────

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (_token) config.headers.set("Authorization", `Bearer ${_token}`);
  return config;
});

// ─── Interceptor de response: normaliza erros ────────────────────────────────

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number
  ) {
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
      message = data.detail.map((e) => e.msg ?? "Erro de validação").join("; ");
    } else if (data?.message) {
      message = data.message;
    } else if (error.message) {
      message = error.message;
    }

    return Promise.reject(new ApiError(message, error.response?.status));
  }
);
