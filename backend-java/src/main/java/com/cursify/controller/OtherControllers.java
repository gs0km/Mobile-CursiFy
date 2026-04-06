package com.cursify.controller;

import com.cursify.dto.Dtos.*;
import com.cursify.exception.GlobalExceptionHandler.ApiException;
import com.cursify.model.Course;
import com.cursify.model.Enrollment;
import com.cursify.model.User;
import com.cursify.repository.CourseRepository;
import com.cursify.repository.EnrollmentRepository;
import com.cursify.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class OtherControllers {

    private final EnrollmentRepository enrollmentRepo;
    private final CourseRepository courseRepo;
    private final UserRepository userRepo;

    public OtherControllers(EnrollmentRepository enrollmentRepo, CourseRepository courseRepo, UserRepository userRepo) {
        this.enrollmentRepo = enrollmentRepo;
        this.courseRepo = courseRepo;
        this.userRepo = userRepo;
    }

    // GET /api/enrollments/me
    @GetMapping("/enrollments/me")
    public ResponseEntity<List<EnrolledCourseResponse>> myEnrollments(@AuthenticationPrincipal User user) {
        List<Enrollment> enrollments = enrollmentRepo.findByUserId(user.getUserId());
        if (enrollments.isEmpty()) return ResponseEntity.ok(List.of());

        List<String> courseIds = enrollments.stream().map(Enrollment::getCourseId).toList();
        Map<String, Course> courseMap = courseRepo.findAll().stream()
            .filter(c -> courseIds.contains(c.getCourseId()))
            .collect(Collectors.toMap(Course::getCourseId, c -> c));

        List<EnrolledCourseResponse> result = new ArrayList<>();
        for (Enrollment e : enrollments) {
            Course c = courseMap.get(e.getCourseId());
            if (c != null) result.add(new EnrolledCourseResponse(
                e.getEnrollmentId(), e.getEnrolledAt(), toCourseResponse(c)
            ));
        }
        return ResponseEntity.ok(result);
    }

    // GET /api/professor/courses
    @GetMapping("/professor/courses")
    public ResponseEntity<List<CourseResponse>> professorCourses(@AuthenticationPrincipal User user) {
        if (!user.getRole().equals("teacher") && !user.getRole().equals("admin"))
            throw new ApiException("Você não tem permissão para esta ação.", HttpStatus.FORBIDDEN);

        List<Course> courses = user.getRole().equals("admin")
            ? courseRepo.findAllByOrderByCreatedAtDesc()
            : courseRepo.findByTeacherIdOrderByCreatedAtDesc(user.getUserId());

        return ResponseEntity.ok(courses.stream().map(this::toCourseResponse).toList());
    }

    // GET /api/admin/overview
    @GetMapping("/admin/overview")
    public ResponseEntity<AdminOverview> adminOverview(@AuthenticationPrincipal User user) {
        if (!user.getRole().equals("admin"))
            throw new ApiException("Você não tem permissão para esta ação.", HttpStatus.FORBIDDEN);

        return ResponseEntity.ok(new AdminOverview(
            userRepo.count(),
            userRepo.countByRole("student"),
            userRepo.countByRole("teacher"),
            userRepo.countByRole("admin"),
            courseRepo.count(),
            enrollmentRepo.count()
        ));
    }

    // GET /api/admin/users
    @GetMapping("/admin/users")
    public ResponseEntity<List<UserResponse>> adminUsers(@AuthenticationPrincipal User user) {
        if (!user.getRole().equals("admin"))
            throw new ApiException("Você não tem permissão para esta ação.", HttpStatus.FORBIDDEN);
        return ResponseEntity.ok(userRepo.findAll().stream().map(this::toUserResponse).toList());
    }

    // PATCH /api/admin/users/{userId}/status
    @PatchMapping("/admin/users/{userId}/status")
    public ResponseEntity<UserResponse> toggleUserStatus(
        @AuthenticationPrincipal User admin,
        @PathVariable String userId,
        @RequestBody java.util.Map<String, Boolean> body
    ) {
        if (!admin.getRole().equals("admin"))
            throw new ApiException("Você não tem permissão para esta ação.", HttpStatus.FORBIDDEN);
        User target = userRepo.findByUserId(userId)
            .orElseThrow(() -> new ApiException("Usuário não encontrado.", HttpStatus.NOT_FOUND));
        target.setActive(body.getOrDefault("active", true));
        userRepo.save(target);
        return ResponseEntity.ok(toUserResponse(target));
    }

    private UserResponse toUserResponse(User u) {
        return new UserResponse(u.getUserId(), u.getEmail(), u.getUsername(),
            u.getRole(), u.getBio(), u.getProfileImageBase64(), u.getCreatedAt(), u.isActive());
    }

    private CourseResponse toCourseResponse(Course c) {
        return new CourseResponse(c.getCourseId(), c.getTeacherId(), c.getTeacherName(),
            c.getTitle(), c.getCategory(), c.getDescription(), c.getPedagogyDescription(),
            c.getLevel(), c.getLessonsCount(), c.getEstimatedHours(),
            c.getThumbnailBase64(), c.getEnrolledCount(), c.getCreatedAt());
    }
}
