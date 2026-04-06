/**
 * enrollmentService.ts — Serviço de inscrições em cursos.
 *
 * CRUD:
 *   getAll  → inscrições do usuário autenticado
 *   getById → não aplicável (sem endpoint individual)
 *   create  → inscreve o usuário autenticado em um curso
 *   update  → não aplicável
 *   remove  → não aplicável (sem endpoint de cancelamento)
 */
import { api } from "./api";
import { Enrollment } from "../types";

const enrollmentService = {
  /** Lista todas as inscrições do usuário autenticado. */
  getAll: () => api.get<Enrollment[]>("/enrollments/me").then((r) => r.data),

  /** Inscreve o usuário autenticado no curso informado. */
  create: (courseId: string) =>
    api
      .post<{ enrollment_id: string }>(`/courses/${courseId}/enroll`)
      .then((r) => r.data),

  getById: (_id: string): Promise<Enrollment> =>
    Promise.reject(new Error("Endpoint não implementado.")),
  update: (): Promise<void> => Promise.reject(new Error("Endpoint não implementado.")),
  remove: (): Promise<void> => Promise.reject(new Error("Endpoint não implementado.")),
};

export default enrollmentService;
