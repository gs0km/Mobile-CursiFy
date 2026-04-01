import {
  AdminOverview,
  AuthResponse,
  Course,
  CreateCoursePayload,
  Enrollment,
  LoginPayload,
  RegisterPayload,
  User,
} from "../types";

interface ApiErrorPayload {
  detail?: string | Array<{ msg?: string; loc?: (string | number)[] }>;
  message?: string;
}

class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

function normalizeBaseUrl(baseUrl: string): string {
  const withoutSlash = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  if (withoutSlash.endsWith("/api")) {
    return withoutSlash;
  }
  return `${withoutSlash}/api`;
}

async function parseApiError(response: Response): Promise<never> {
  let message = "Erro inesperado na API.";
  try {
    const payload = (await response.json()) as ApiErrorPayload;
    
    // Se detail for uma string, use-a
    if (typeof payload.detail === "string") {
      message = payload.detail;
    }
    // Se detail for um array (erros de validação do Pydantic), extraia as mensagens
    else if (Array.isArray(payload.detail)) {
      const errors = payload.detail
        .map((err) => err.msg || "Erro de validação")
        .join("; ");
      message = errors || message;
    }
    // Fallback para message
    else if (payload.message) {
      message = payload.message;
    }
  } catch (jsonError) {
    // Se não conseguir fazer parse do JSON, use o statusText
    message = response.statusText || `Erro HTTP ${response.status}`;
  }
  throw new ApiError(message);
}

export function createApiClient(baseUrl: string) {
  const apiBaseUrl = normalizeBaseUrl(baseUrl);

  async function request<T>(
    path: string,
    options: RequestInit = {},
    token?: string
  ): Promise<T> {
    const headers = new Headers(options.headers ?? {});
    headers.set("Content-Type", "application/json");

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(`${apiBaseUrl}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      await parseApiError(response);
    }

    return (await response.json()) as T;
  }

  return {
    register: (payload: RegisterPayload) =>
      request<User>("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    login: (payload: LoginPayload) =>
      request<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    me: (token: string) => request<User>("/auth/me", { method: "GET" }, token),

    getCourses: () => request<Course[]>("/courses", { method: "GET" }),

    getCourseById: (courseId: string) => request<Course>(`/courses/${courseId}`, { method: "GET" }),

    createCourse: (payload: CreateCoursePayload, token: string) =>
      request<Course>("/courses", {
        method: "POST",
        body: JSON.stringify(payload),
      }, token),

    enroll: (courseId: string, token: string) =>
      request<{ enrollment_id: string }>(`/courses/${courseId}/enroll`, {
        method: "POST",
      }, token),

    myEnrollments: (token: string) => request<Enrollment[]>("/enrollments/me", { method: "GET" }, token),

    professorCourses: (token: string) =>
      request<Course[]>("/professor/courses", { method: "GET" }, token),

    adminOverview: (token: string) =>
      request<AdminOverview>("/admin/overview", { method: "GET" }, token),
  };
}

export { ApiError };