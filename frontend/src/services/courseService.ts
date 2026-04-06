import { api } from "./api";
import { Course, CreateCoursePayload } from "../types";

interface BackendCourse {
  id: number;
  nome: string;
  descricao: string;
  categoria: string;
  cargaHoraria: number;
  dataCriacao: string;
  statusCurso: string | boolean;
}

function isCourseActive(status: BackendCourse["statusCurso"]) {
  return status === true || status === "Ativo";
}

function normalizeLevel(category: string): Course["level"] {
  if (category?.includes("MEDIO")) return "intermediate";
  return "beginner";
}

function mapCourse(course: BackendCourse): Course {
  return {
    course_id: String(course.id),
    teacher_id: "",
    teacher_name: "Professor CursiFy",
    title: course.nome,
    category: course.categoria,
    description: course.descricao,
    pedagogy_description: course.descricao,
    level: normalizeLevel(course.categoria),
    lessons_count: 0,
    estimated_hours: Number(course.cargaHoraria) || 0,
    thumbnail_base64: "",
    enrolled_count: 0,
    created_at: course.dataCriacao ?? new Date().toISOString(),
  };
}

const courseService = {
  getAll: (category?: string) =>
    api
      .get<BackendCourse[]>("/curso")
      .then((response) => response.data
        .filter((course) => isCourseActive(course.statusCurso))
        .map(mapCourse)
        .filter((course) => !category || course.category === category)),

  getById: (courseId: string) =>
    api.get<BackendCourse>(`/curso/${courseId}`).then((response) => mapCourse(response.data)),

  create: (payload: CreateCoursePayload) =>
    api
      .post<BackendCourse>("/curso", {
        nome: payload.title,
        descricao: payload.description,
        categoria: payload.category,
        cargaHoraria: payload.estimated_hours,
        dataCriacao: new Date().toISOString(),
        statusCurso: "Ativo",
      })
      .then((response) => mapCourse(response.data)),

  update: (_courseId: string, _payload: Partial<CreateCoursePayload>): Promise<Course> =>
    Promise.reject(new Error("Endpoint nao implementado.")),

  remove: (courseId: string) =>
    api.delete<void>(`/curso/${courseId}`).then(() => undefined),

  getProfessorCourses: () => courseService.getAll(),
};

export default courseService;
