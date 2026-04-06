package com.cursify.repository;

import com.cursify.model.Course;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface CourseRepository extends MongoRepository<Course, String> {
    Optional<Course> findByCourseId(String courseId);
    List<Course> findAllByOrderByCreatedAtDesc();
    List<Course> findByCategoryOrderByCreatedAtDesc(String category);
    List<Course> findByTeacherIdOrderByCreatedAtDesc(String teacherId);
    boolean existsByCourseId(String courseId);
    void deleteByCourseId(String courseId);
    void deleteByCourseIdAndTeacherId(String courseId, String teacherId);
}
