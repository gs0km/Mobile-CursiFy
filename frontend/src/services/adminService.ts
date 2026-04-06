/**
 * adminService.ts — Serviço do painel administrativo.
 *
 * getAll → retorna overview com totais de usuários, cursos e inscrições (admin only)
 */
import { api } from "./api";
import { AdminOverview } from "../types";

const adminService = {
  /** Retorna métricas gerais da plataforma. Requer role admin. */
  getAll: () => api.get<AdminOverview>("/admin/overview").then((r) => r.data),
};

export default adminService;
