import { ApiError, api, getAuthToken } from "./api";
import { AuthResponse, LoginPayload, RegisterPayload, UpdateProfilePayload, User } from "../types";

type BackendRole = "ALUNO" | "PROFESSOR" | "ADMIN";

interface BackendUser {
  id: number;
  nome: string;
  email: string;
  cpf?: string;
  senha?: string;
  nivelAcesso: BackendRole;
  dataCadastro?: string;
  statusUsuario?: string | boolean;
  bio?: string;
  temaPreferido?: "light" | "dark";
  foto?: string;
  fotoCapa?: string;
}

function mapRole(role: BackendRole): User["role"] {
  if (role === "PROFESSOR") return "teacher";
  if (role === "ADMIN") return "admin";
  return "student";
}

function mapBackendRole(role: User["role"]): BackendRole {
  if (role === "teacher") return "PROFESSOR";
  if (role === "admin") return "ADMIN";
  return "ALUNO";
}

function isUserActive(status: BackendUser["statusUsuario"]) {
  if (status == null) return true;
  return status === true || status === "Ativo";
}

function normalizeText(value: unknown) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, "")
    .trim();
}

function normalizeEmail(value: unknown) {
  return normalizeText(value).toLowerCase();
}

function normalizePassword(value: unknown) {
  return normalizeText(value);
}

function normalizeCpf(value: unknown) {
  return String(value ?? "").replace(/\D/g, "");
}

function toBackendImage(value: unknown) {
  if (!value) return null;
  const text = String(value);
  return text.includes(",") ? text.substring(text.indexOf(",") + 1) : text;
}

function toImageUri(value: unknown) {
  if (!value) return "";
  const text = String(value);
  return text.startsWith("data:") ? text : `data:image/jpeg;base64,${text}`;
}

function mapUser(user: BackendUser): User {
  return {
    user_id: String(user.id),
    email: user.email,
    username: user.nome,
    cpf: user.cpf ?? "",
    role: mapRole(user.nivelAcesso),
    bio: user.bio ?? "",
    profile_image_base64: toImageUri(user.foto),
    cover_image_base64: toImageUri(user.fotoCapa),
    tema_preferido: user.temaPreferido === "dark" ? "dark" : "light",
    created_at: user.dataCadastro ?? new Date().toISOString(),
    active: isUserActive(user.statusUsuario),
  };
}

function requireAuthenticatedUserId() {
  const token = getAuthToken();
  if (!token) {
    throw new ApiError("Sessao nao encontrada.", 401);
  }

  return token;
}

const authService = {
  create: async (payload: RegisterPayload) => {
    const cpf = normalizeCpf(payload.cpf);
    if (cpf.length !== 11) {
      throw new ApiError("Informe um CPF com 11 digitos.", 400);
    }

    const user = await api
      .post<BackendUser>("/usuario", {
        nome: payload.username,
        email: normalizeEmail(payload.email),
        cpf,
        senha: normalizePassword(payload.password),
        nivelAcesso: mapBackendRole(payload.role),
        dataCadastro: new Date().toISOString(),
        statusUsuario: "Ativo",
      })
      .then((response) => mapUser(response.data));
    return user;
  },

  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const response = await api.post<BackendUser>("/usuario/login", {
      email: normalizeEmail(payload.email),
      senha: normalizePassword(payload.password),
    });
    const user = response.data;

    const normalizedUser = mapUser(user);
    return {
      access_token: normalizedUser.user_id,
      token_type: "local",
      user: normalizedUser,
    };
  },

  me: () => authService.getById(requireAuthenticatedUserId()),

  update: async (payload: UpdateProfilePayload) => {
    const userId = requireAuthenticatedUserId();
    const currentResponse = await api.get<BackendUser>(`/usuario/${userId}`);
    const updatedResponse = await api.put<BackendUser>(`/usuario/${userId}/perfil`, {
      nome: payload.username,
      bio: payload.bio ?? currentResponse.data.bio ?? "",
      foto: toBackendImage(payload.profile_image_base64) || currentResponse.data.foto || null,
      fotoCapa: toBackendImage(payload.cover_image_base64) || currentResponse.data.fotoCapa || null,
      temaPreferido: payload.tema_preferido || currentResponse.data.temaPreferido || "light",
    });

    const result = {
      ...mapUser(updatedResponse.data),
      bio: payload.bio,
      profile_image_base64: payload.profile_image_base64,
      cover_image_base64: payload.cover_image_base64,
      tema_preferido: payload.tema_preferido,
    };
    return result;
  },

  updateTheme: async (theme: "light" | "dark") => {
    const userId = requireAuthenticatedUserId();
    const response = await api.put<{ temaPreferido: "light" | "dark" }>(`/usuario/${userId}/tema`, { temaPreferido: theme });
    return response.data.temaPreferido;
  },

  getAll: () => api.get<BackendUser[]>("/usuario").then((response) => response.data.map(mapUser)),
  getById: (id: string) => api.get<BackendUser>(`/usuario/${id}`).then((response) => mapUser(response.data)),
  remove: (id: string) => api.delete(`/usuario/${id}`).then(() => undefined),

  resetPassword: async (email: string, newPassword: string) => {
    const response = await api.get<BackendUser[]>("/usuario");
    const user = response.data.find((u) => normalizeEmail(u.email) === normalizeEmail(email));
    if (!user) throw new ApiError("Nenhuma conta encontrada com esse e-mail.", 404);
    await api.put(`/usuario/${user.id}`, { ...user, senha: normalizePassword(newPassword) });
  },
};

export default authService;
