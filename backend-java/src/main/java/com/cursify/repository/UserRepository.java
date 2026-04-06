package com.cursify.repository;

import com.cursify.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);
    Optional<User> findByUserId(String userId);
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
    long countByRole(String role);
}
