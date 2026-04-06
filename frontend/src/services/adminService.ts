import { api } from "./api";
import { AdminOverview, User } from "../types";

const adminService = {
  getAll: () => api.get<AdminOverview>("/admin/overview").then((r) => r.data),
  getUsers: () => api.get<User[]>("/admin/users").then((r) => r.data),
  setUserStatus: (userId: string, active: boolean) =>
    api.patch<User>(`/admin/users/${userId}/status`, { active }).then((r) => r.data),
};

export default adminService;
