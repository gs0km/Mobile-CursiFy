export type UserRole = "student" | "teacher" | "admin";

export interface User {
  user_id: string;
  email: string;
  username: string;
  role: UserRole;
  bio: string;
  profile_image_base64: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface RegisterPayload {
  email: string;
  username: string;
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
  thumbnail_base64: string;
  enrolled_count: number;
  created_at: string;
}

export interface CreateCoursePayload {
  title: string;
  category: string;
  description: string;
  pedagogy_description: string;
  level: CourseLevel;
  lessons_count: number;
  estimated_hours: number;
  thumbnail_base64: string;
}

export interface Enrollment {
  enrollment_id: string;
  enrolled_at: string;
  course: Course;
}

export interface AdminOverview {
  users_total: number;
  students_total: number;
  teachers_total: number;
  admins_total: number;
  courses_total: number;
  enrollments_total: number;
}

export type AppTab = "catalog" | "my-courses" | "teacher" | "admin" | "profile";