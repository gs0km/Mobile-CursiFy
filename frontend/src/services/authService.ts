/**
 * authService.ts — Serviço de autenticação e perfil de usuário.
 *
 * Funções CRUD padrão:
 *   getAll    → lista todos os usuários (admin)
 *   getById   → busca usuário por ID
 *   create    → registra novo usuário
 *   update    → atualiza perfil do usuário autenticado
 *   remove    → não aplicável (sem endpoint de deleção de conta)
 *
 * Funções específicas:
 *   login     → autentica e retorna token + usuário
 *   me        → retorna o usuário autenticado atual
 */
import { api } from "./api";
import {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  UpdateProfilePayload,
  User,
} from "../types";

const AUTH = "/auth";

const authService = {
  /** Registra um novo usuário. Equivale a CREATE. */
  create: (payload: RegisterPayload) =>
    api.post<User>(`${AUTH}/register`, payload).then((r) => r.data),

  /** Autentica o usuário e retorna access_token + dados do usuário. */
  login: (payload: LoginPayload) =>
    api.post<AuthResponse>(`${AUTH}/login`, payload).then((r) => r.data),

  /** Retorna o usuário autenticado pelo token no header. Equivale a GET by token. */
  me: () => api.get<User>(`${AUTH}/me`).then((r) => r.data),

  /** Atualiza username, bio e foto do usuário autenticado. Equivale a UPDATE. */
  update: (payload: UpdateProfilePayload) =>
    api.put<User>(`${AUTH}/profile`, payload).then((r) => r.data),

  // getAll e getById não têm endpoint no backend atual — reservados para expansão futura.
  getAll: (): Promise<User[]> => Promise.reject(new Error("Endpoint não implementado.")),
  getById: (_id: string): Promise<User> => Promise.reject(new Error("Endpoint não implementado.")),
  remove: (_id: string): Promise<void> => Promise.reject(new Error("Endpoint não implementado.")),
};

export default authService;
