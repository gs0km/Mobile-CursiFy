package com.cursify.controller;

import com.cursify.dto.Dtos.*;
import com.cursify.exception.GlobalExceptionHandler.ApiException;
import com.cursify.model.Course;
import com.cursify.model.Enrollment;
import com.cursify.model.User;
import com.cursify.repository.CourseRepository;
import com.cursify.repository.EnrollmentRepository;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/courses")
public class CourseController {

    private final CourseRepository courseRepo;
    private final EnrollmentRepository enrollmentRepo;
    private final MongoTemplate mongoTemplate;

    public CourseController(CourseRepository courseRepo, EnrollmentRepository enrollmentRepo, MongoTemplate mongoTemplate) {
        this.courseRepo = courseRepo;
        this.enrollmentRepo = enrollmentRepo;
        this.mongoTemplate = mongoTemplate;
    }

    @GetMapping
    public ResponseEntity<List<CourseResponse>> list(@RequestParam(required = false) String category) {
        List<Course> courses = category != null
            ? courseRepo.findByCategoryOrderByCreatedAtDesc(category)
            : courseRepo.findAllByOrderByCreatedAtDesc();
        return ResponseEntity.ok(courses.stream().map(this::toResponse).toList());
    }

    @GetMapping("/{courseId}")
    public ResponseEntity<CourseResponse> getById(@PathVariable String courseId) {
        Course course = courseRepo.findByCourseId(courseId)
            .orElseThrow(() -> new ApiException("Curso não encontrado.", HttpStatus.NOT_FOUND));
        return ResponseEntity.ok(toResponse(course));
    }

    @PostMapping
    public ResponseEntity<CourseResponse> create(
        @AuthenticationPrincipal User user,
        @RequestBody CourseRequest req
    ) {
        if (!user.getRole().equals("teacher") && !user.getRole().equals("admin"))
            throw new ApiException("Você não tem permissão para esta ação.", HttpStatus.FORBIDDEN);

        Course course = new Course();
        course.setCourseId(UUID.randomUUID().toString());
        course.setTeacherId(user.getUserId());
        course.setTeacherName(user.getUsername());
        course.setTitle(req.title().trim());
        course.setCategory(req.category().trim());
        course.setDescription(req.description().trim());
        course.setPedagogyDescription(req.pedagogyDescription().trim());
        course.setLevel(req.level());
        course.setLessonsCount(req.lessonsCount());
        course.setEstimatedHours(req.estimatedHours());
        course.setThumbnailBase64(req.thumbnailBase64() != null ? req.thumbnailBase64() : "");
        course.setEnrolledCount(0);
        course.setCreatedAt(Instant.now().toString());
        courseRepo.save(course);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(course));
    }

    @DeleteMapping("/{courseId}")
    public ResponseEntity<Void> delete(
        @AuthenticationPrincipal User user,
        @PathVariable String courseId
    ) {
        if (!user.getRole().equals("teacher") && !user.getRole().equals("admin"))
            throw new ApiException("Você não tem permissão para esta ação.", HttpStatus.FORBIDDEN);

        Course course = courseRepo.findByCourseId(courseId)
            .orElseThrow(() -> new ApiException("Curso não encontrado ou sem permissão.", HttpStatus.NOT_FOUND));

        if (user.getRole().equals("teacher") && !course.getTeacherId().equals(user.getUserId()))
            throw new ApiException("Curso não encontrado ou sem permissão.", HttpStatus.NOT_FOUND);

        courseRepo.delete(course);
        enrollmentRepo.deleteByCourseId(courseId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{courseId}/enroll")
    public ResponseEntity<EnrollmentResponse> enroll(
        @AuthenticationPrincipal User user,
        @PathVariable String courseId
    ) {
        if (!user.getRole().equals("student") && !user.getRole().equals("admin"))
            throw new ApiException("Você não tem permissão para esta ação.", HttpStatus.FORBIDDEN);

        if (!courseRepo.existsByCourseId(courseId))
            throw new ApiException("Curso não encontrado.", HttpStatus.NOT_FOUND);

        if (enrollmentRepo.existsByCourseIdAndUserId(courseId, user.getUserId()))
            throw new ApiException("Você já está inscrito neste curso.", HttpStatus.CONFLICT);

        Enrollment enrollment = new Enrollment();
        enrollment.setEnrollmentId(UUID.randomUUID().toString());
        enrollment.setCourseId(courseId);
        enrollment.setUserId(user.getUserId());
        enrollment.setEnrolledAt(Instant.now().toString());
        enrollmentRepo.save(enrollment);

        mongoTemplate.updateFirst(
            Query.query(Criteria.where("courseId").is(courseId)),
            new Update().inc("enrolledCount", 1),
            Course.class
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(
            new EnrollmentResponse(enrollment.getEnrollmentId(), courseId, user.getUserId(), enrollment.getEnrolledAt())
        );
    }

    private CourseResponse toResponse(Course c) {
        return new CourseResponse(c.getCourseId(), c.getTeacherId(), c.getTeacherName(),
            c.getTitle(), c.getCategory(), c.getDescription(), c.getPedagogyDescription(),
            c.getLevel(), c.getLessonsCount(), c.getEstimatedHours(),
            c.getThumbnailBase64(), c.getEnrolledCount(), c.getCreatedAt());
    }
}
