package com.cursify.repository;

import com.cursify.model.Enrollment;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface EnrollmentRepository extends MongoRepository<Enrollment, String> {
    List<Enrollment> findByUserId(String userId);
    Optional<Enrollment> findByCourseIdAndUserId(String courseId, String userId);
    boolean existsByCourseIdAndUserId(String courseId, String userId);
    void deleteByCourseId(String courseId);
}
