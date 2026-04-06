import { ApiError, api, getAuthToken } from "./api";
import { AuthResponse, LoginPayload, RegisterPayload, UpdateProfilePayload, User } from "../types";

type BackendRole = "ALUNO" | "PROFESSOR" | "ADMIN";

interface BackendUser {
  id: number;
  nome: string;
  email: string;
  senha: string;
  nivelAcesso: BackendRole;
  dataCadastro: string;
  statusUsuario: string | boolean;
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

function mapUser(user: BackendUser): User {
  return {
    user_id: String(user.id),
    email: user.email,
    username: user.nome,
    role: mapRole(user.nivelAcesso),
    bio: "",
    profile_image_base64: "",
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
  create: (payload: RegisterPayload) =>
    api
      .post<BackendUser>("/usuario", {
        nome: payload.username,
        email: normalizeEmail(payload.email),
        senha: normalizePassword(payload.password),
        nivelAcesso: mapBackendRole(payload.role),
        dataCadastro: new Date().toISOString(),
        statusUsuario: "Ativo",
      })
      .then((response) => mapUser(response.data)),

  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const response = await api.get<BackendUser[]>("/usuario");
    const normalizedEmail = normalizeEmail(payload.email);
    const normalizedPassword = normalizePassword(payload.password);
    const matchingEmailUsers = response.data.filter(
      (entry) => normalizeEmail(entry.email) === normalizedEmail,
    );
    const user = matchingEmailUsers.find(
      (entry) => normalizePassword(entry.senha) === normalizedPassword,
    );

    if (!user) {
      throw new ApiError("Email ou senha incorretos.", 401);
    }

    if (!isUserActive(user.statusUsuario)) {
      throw new ApiError("Sua conta foi desativada. Entre em contato com o administrador.", 403);
    }

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
    const updatedResponse = await api.put<BackendUser>(`/usuario/${userId}`, {
      ...currentResponse.data,
      nome: payload.username,
    });

    return {
      ...mapUser(updatedResponse.data),
      bio: payload.bio,
      profile_image_base64: payload.profile_image_base64,
    };
  },

  getAll: () => api.get<BackendUser[]>("/usuario").then((response) => response.data.map(mapUser)),
  getById: (id: string) => api.get<BackendUser>(`/usuario/${id}`).then((response) => mapUser(response.data)),
  remove: (id: string) => api.delete(`/usuario/${id}`).then(() => undefined),
};

export default authService;
