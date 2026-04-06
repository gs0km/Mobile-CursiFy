/**
 * courseService.ts — Serviço de cursos.
 *
 * CRUD completo:
 *   getAll    → lista todos os cursos (público)
 *   getById   → detalhe de um curso (público)
 *   create    → cria curso (teacher/admin)
 *   update    → atualiza curso (teacher/admin) — endpoint reservado para expansão
 *   remove    → exclui curso (teacher/admin)
 *
 * Funções específicas:
 *   getProfessorCourses → cursos do professor autenticado
 */
import { api } from "./api";
import { Course, CreateCoursePayload } from "../types";

const COURSES = "/courses";

const courseService = {
  /** Lista todos os cursos. Aceita filtro opcional por categoria. */
  getAll: (category?: string) =>
    api
      .get<Course[]>(COURSES, { params: category ? { category } : undefined })
      .then((r) => r.data),

  /** Retorna detalhes de um curso pelo ID. */
  getById: (courseId: string) =>
    api.get<Course>(`${COURSES}/${courseId}`).then((r) => r.data),

  /** Cria um novo curso. Requer token de teacher ou admin (injetado automaticamente). */
  create: (payload: CreateCoursePayload) =>
    api.post<Course>(COURSES, payload).then((r) => r.data),

  /** Atualiza um curso existente. Reservado para expansão futura. */
  update: (_courseId: string, _payload: Partial<CreateCoursePayload>): Promise<Course> =>
    Promise.reject(new Error("Endpoint não implementado.")),

  /** Exclui um curso pelo ID. Requer token de teacher (próprio) ou admin. */
  remove: (courseId: string) =>
    api.delete<void>(`${COURSES}/${courseId}`).then(() => undefined),

  /** Lista os cursos do professor autenticado (ou todos, se admin). */
  getProfessorCourses: () =>
    api.get<Course[]>("/professor/courses").then((r) => r.data),
};

export default courseService;
