import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "./api";
import { Course, CourseExercise, CourseMaterial, CourseRating, CreateCoursePayload } from "../types";

const FAVORITES_KEY = "cursify_favorites";
const RATINGS_KEY = "cursify_ratings";

const preference = async (usuarioId: string, cursoId: string, tipo: string, valor: string) => api.put('/preferencia', { usuarioId: Number(usuarioId), cursoId: Number(cursoId), tipo, valor });
const preferences = async (usuarioId: string, tipo: string) => (await api.get<any[]>('/preferencia', { params: { usuarioId: Number(usuarioId), tipo } })).data;

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
    carga_horaria: Number(course.cargaHoraria) || 0,
    thumbnail_base64: "",
    enrolled_count: Number((course as any).enrolledCount ?? (course as any).enrolled_count ?? 0),
    created_at: course.dataCriacao ?? new Date().toISOString(),
    video_links: [],
    site_links: [],
  };
}

const LINKS_KEY = "cursify_course_links";

async function loadLinksMap(): Promise<Record<string, { video_links: string[]; site_links: string[] }>> { return {}; }

const courseService = {
  getAll: async (category?: string) => {
    const [response, linksMap] = await Promise.all([
      api.get<BackendCourse[]>("/curso"),
      loadLinksMap(),
    ]);
    const activeCourses = response.data
      .filter((course) => isCourseActive(course.statusCurso))
      .map((course) => ({
        ...mapCourse(course),
        ...(linksMap[String(course.id)] ?? { video_links: [], site_links: [] }),
      }));
    const coursesWithEnrollment = await Promise.all(activeCourses.map(async (course) => {
      try {
        const occupancy = await api.get<{ matriculados: number }>(`/usuarioCurso/ocupacao/${course.course_id}`);
        return { ...course, enrolled_count: Number(occupancy.data.matriculados) || 0 };
      } catch {
        return course;
      }
    }));
    return coursesWithEnrollment.filter((course) => !category || course.category === category);
  },

  getById: async (courseId: string) => {
    const [response, linksMap] = await Promise.all([
      api.get<BackendCourse>(`/curso/${courseId}`),
      loadLinksMap(),
    ]);
    return {
      ...mapCourse(response.data),
      ...(linksMap[courseId] ?? { video_links: [], site_links: [] }),
    };
  },

  create: async (payload: CreateCoursePayload) => {
    const response = await api.post<BackendCourse>("/curso", {
      nome: payload.title,
      descricao: payload.description,
      categoria: payload.category,
      cargaHoraria: payload.carga_horaria,
      dataCriacao: new Date().toISOString(),
      statusCurso: "Em progresso",
    });
    return { mapped: mapCourse(response.data), raw: response.data };
  },

  update: (_courseId: string, _payload: Partial<CreateCoursePayload>): Promise<Course> =>
    Promise.reject(new Error("Endpoint nao implementado.")),

  remove: (courseId: string) =>
    api.delete<void>(`/curso/${courseId}`).then(() => undefined),

  getContentByCourse: async (courseId: string): Promise<CourseMaterial[]> => {
    const response = await api.get<any[]>("/material", { params: { cursoId: courseId } });
    const all = Array.isArray(response.data) ? response.data : [];
    return all
      .filter((m) => String(m.curso?.id ?? m.curso_id ?? m.cursoId) === courseId)
      .map((m) => ({ id: m.id, titulo: m.titulo ?? '', subtitulo: m.subtitulo ?? '', conteudo: m.conteudo ?? '', link: m.link ?? '', statusMaterial: m.statusMaterial ?? '' }));
  },

  getExercisesByCourse: async (courseId: string): Promise<CourseExercise[]> => {
    const response = await api.get<any[]>("/exercicios");
    return (response.data ?? [])
      .filter((item) => String(item.curso?.id ?? item.curso_id ?? item.cursoId) === courseId)
      .map((item) => ({ id: item.id, titulo: item.titulo ?? "Exercício", enunciado: item.enunciado ?? item.conteudo ?? "", alternativas: Array.isArray(item.alternativas) ? item.alternativas.filter(Boolean) : [], respostaCorreta: item.respostaCorreta ?? "", explicacao: item.explicacao }));
  },

  getProgress: async (userId: string, courseId: string) => {
    try {
      const response = await api.get<{ progresso: number; concluido?: boolean }>(`/usuarioCurso/progresso/${userId}/${courseId}`);
      const individual = Number(response.data?.progresso) || 0;
      const rows = await api.get<any[]>("/usuarioCurso");
      const row = (rows.data ?? []).find((item) => String(item.usuario?.id ?? item.usuario_id) === String(userId) && String(item.curso?.id ?? item.curso_id) === String(courseId));
      return { ...response.data, progresso: Math.max(individual, Number(row?.progresso) || 0) };
    } catch {
      const response = await api.get<any[]>("/usuarioCurso");
      const row = (response.data ?? []).find((item) => String(item.usuario?.id ?? item.usuario_id) === String(userId) && String(item.curso?.id ?? item.curso_id) === String(courseId));
      return { progresso: Number(row?.progresso) || 0, concluido: Boolean(row?.concluido) };
    }
  },

  saveProgress: async (userId: string, courseId: string, progresso: number) => {
    const response = await api.put(`/usuarioCurso/progresso/${userId}/${courseId}`, { progresso, concluido: progresso >= 100 });
    return response.data;
  },

  getProfessorCourses: () => courseService.getAll(),

  toggleFavorite: async (userId: string, courseId: string): Promise<boolean> => {
    const list = await preferences(userId, 'FAVORITO');
    const isFav = list.some((p) => String(p.cursoId) === courseId);
    if (isFav) await api.delete('/preferencia', { params: { usuarioId: userId, cursoId: courseId, tipo: 'FAVORITO' } });
    else await preference(userId, courseId, 'FAVORITO', 'true');
    return !isFav;
  },

  getFavorites: async (userId: string): Promise<string[]> => {
    return (await preferences(userId, 'FAVORITO')).map((p) => String(p.cursoId));
  },

  rateCourse: async (userId: string, courseId: string, rating: number): Promise<CourseRating> => {
    await preference(userId, courseId, 'AVALIACAO', String(rating));
    const ratings = (await api.get<any[]>('/preferencia', { params: { usuarioId: userId, tipo: 'AVALIACAO' } })).data.map((p) => Number(p.valor));
    return { average: ratings.reduce((a, b) => a + b, 0) / ratings.length, count: ratings.length, userRating: rating };
  },

  getRating: async (userId: string, courseId: string): Promise<CourseRating> => {
    const rows = await preferences(userId, 'AVALIACAO');
    const row = rows.find((p) => String(p.cursoId) === courseId);
    return { average: row ? Number(row.valor) : 0, count: row ? 1 : 0, userRating: row ? Number(row.valor) : 0 };
  },
};

export default courseService;
