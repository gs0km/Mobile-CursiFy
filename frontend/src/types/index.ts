export type UserRole = "student" | "teacher" | "admin";

export interface User {
  user_id: string;
  email: string;
  username: string;
  cpf: string;
  role: UserRole;
  bio: string;
  profile_image_base64: string;
  cover_image_base64: string;
  created_at: string;
  active: boolean;
  tema_preferido?: "light" | "dark";
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface RegisterPayload {
  email: string;
  username: string;
  cpf: string;
  password: string;
  role: UserRole;
  bio: string;
  profile_image_base64: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export type CourseLevel = "beginner" | "intermediate" | "advanced";

export interface Course {
  course_id: string;
  teacher_id: string;
  teacher_name: string;
  title: string;
  category: string;
  description: string;
  pedagogy_description: string;
  level: CourseLevel;
  lessons_count: number;
  estimated_hours: number;
  carga_horaria: number;
  thumbnail_base64: string;
  enrolled_count: number;
  progresso?: number;
  created_at: string;
  video_links: string[];
  site_links: string[];
}

export interface CreateCoursePayload {
  title: string;
  category: string;
  description: string;
  carga_horaria: number;
}

export interface Enrollment {
  enrollment_id: string;
  enrolled_at: string;
  status: "Em andamento" | "Concluído";
  course: Course;
}

export interface UpdateProfilePayload {
  username: string;
  bio: string;
  profile_image_base64: string;
  cover_image_base64: string;
  tema_preferido?: "light" | "dark";
}

export interface AdminOverview {
  users_total: number;
  students_total: number;
  teachers_total: number;
  admins_total: number;
  courses_total: number;
  enrollments_total: number;
}

export interface CourseMaterial {
  id: number;
  titulo: string;
  subtitulo: string;
  conteudo: string;
  link: string;
  statusMaterial: string;
}

export interface CourseExercise {
  id: number;
  titulo: string;
  enunciado: string;
  alternativas: string[];
  respostaCorreta: string;
  explicacao?: string;
}

export type AppTab = "catalog" | "my-courses" | "teacher" | "admin" | "profile" | "chat";

export interface CourseRating {
  average: number;
  count: number;
  userRating: number;
}

export interface CourseCompletion {
  completed: boolean;
  completedAt: string;
  rating: number;
  feedback: string;
}

export interface ChatMessage {
  message_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  created_at: string;
}
