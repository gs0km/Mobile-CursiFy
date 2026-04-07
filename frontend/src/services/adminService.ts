import { api } from "./api";
import { AdminOverview, User } from "../types";

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

interface BackendCourse {
  id: number;
}

function mapRole(role: BackendRole): User["role"] {
  if (role === "PROFESSOR") return "teacher";
  if (role === "ADMIN") return "admin";
  return "student";
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
    active: user.statusUsuario === true || user.statusUsuario === "Ativo",
  };
}

const adminService = {
  getAll: async (): Promise<AdminOverview> => {
    const [usersResponse, coursesResponse] = await Promise.all([
      api.get<BackendUser[]>("/usuario"),
      api.get<BackendCourse[]>("/curso"),
    ]);

    const users = usersResponse.data;

    return {
      users_total: users.length,
      students_total: users.filter((user) => user.nivelAcesso === "ALUNO").length,
      teachers_total: users.filter((user) => user.nivelAcesso === "PROFESSOR").length,
      admins_total: users.filter((user) => user.nivelAcesso === "ADMIN").length,
      courses_total: coursesResponse.data.length,
      enrollments_total: 0,
    };
  },

  getUsers: () => api.get<BackendUser[]>("/usuario").then((response) => response.data.map(mapUser)),

  setUserStatus: async (userId: string, active: boolean) => {
    const currentResponse = await api.get<BackendUser>(`/usuario/${userId}`);
    const updatedResponse = await api.put<BackendUser>(`/usuario/${userId}`, {
      ...currentResponse.data,
      statusUsuario: active ? "Ativo" : "Inativo",
    });

    return mapUser(updatedResponse.data);
  },
};

export default adminService;
