package com.cursify.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

// ─── Auth ─────────────────────────────────────────────────────────────────────

public class Dtos {

    public record RegisterRequest(
        String email, String username, String password, String role,
        String bio,
        @JsonProperty("profile_image_base64") String profileImageBase64
    ) {}

    public record LoginRequest(String email, String password) {}

    public record UserResponse(
        @JsonProperty("user_id") String userId,
        String email, String username, String role, String bio,
        @JsonProperty("profile_image_base64") String profileImageBase64,
        @JsonProperty("created_at") String createdAt
    ) {}

    public record LoginResponse(
        @JsonProperty("access_token") String accessToken,
        @JsonProperty("token_type") String tokenType,
        UserResponse user
    ) {}

    public record UpdateProfileRequest(
        String username, String bio,
        @JsonProperty("profile_image_base64") String profileImageBase64
    ) {}

    // ─── Courses ──────────────────────────────────────────────────────────────

    public record CourseRequest(
        String title, String category, String description,
        @JsonProperty("pedagogy_description") String pedagogyDescription,
        String level,
        @JsonProperty("lessons_count") int lessonsCount,
        @JsonProperty("estimated_hours") int estimatedHours,
        @JsonProperty("thumbnail_base64") String thumbnailBase64
    ) {}

    public record CourseResponse(
        @JsonProperty("course_id") String courseId,
        @JsonProperty("teacher_id") String teacherId,
        @JsonProperty("teacher_name") String teacherName,
        String title, String category, String description,
        @JsonProperty("pedagogy_description") String pedagogyDescription,
        String level,
        @JsonProperty("lessons_count") int lessonsCount,
        @JsonProperty("estimated_hours") int estimatedHours,
        @JsonProperty("thumbnail_base64") String thumbnailBase64,
        @JsonProperty("enrolled_count") int enrolledCount,
        @JsonProperty("created_at") String createdAt
    ) {}

    // ─── Enrollments ──────────────────────────────────────────────────────────

    public record EnrollmentResponse(
        @JsonProperty("enrollment_id") String enrollmentId,
        @JsonProperty("course_id") String courseId,
        @JsonProperty("user_id") String userId,
        @JsonProperty("enrolled_at") String enrolledAt
    ) {}

    public record EnrolledCourseResponse(
        @JsonProperty("enrollment_id") String enrollmentId,
        @JsonProperty("enrolled_at") String enrolledAt,
        CourseResponse course
    ) {}

    // ─── Admin ────────────────────────────────────────────────────────────────

    public record AdminOverview(
        @JsonProperty("users_total") long usersTotal,
        @JsonProperty("students_total") long studentsTotal,
        @JsonProperty("teachers_total") long teachersTotal,
        @JsonProperty("admins_total") long adminsTotal,
        @JsonProperty("courses_total") long coursesTotal,
        @JsonProperty("enrollments_total") long enrollmentsTotal
    ) {}

    public record ErrorResponse(String detail) {}
}
