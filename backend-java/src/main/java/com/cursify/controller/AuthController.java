package com.cursify.controller;

import com.cursify.dto.Dtos.*;
import com.cursify.exception.GlobalExceptionHandler.ApiException;
import com.cursify.model.User;
import com.cursify.repository.UserRepository;
import com.cursify.security.JwtUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepo;
    private final PasswordEncoder encoder;
    private final JwtUtil jwtUtil;

    public AuthController(UserRepository userRepo, PasswordEncoder encoder, JwtUtil jwtUtil) {
        this.userRepo = userRepo;
        this.encoder = encoder;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@RequestBody RegisterRequest req) {
        if (userRepo.existsByEmail(req.email().toLowerCase()))
            throw new ApiException("E-mail já cadastrado.", HttpStatus.CONFLICT);
        if (userRepo.existsByUsername(req.username()))
            throw new ApiException("Username já está em uso.", HttpStatus.CONFLICT);

        User user = new User();
        user.setUserId(UUID.randomUUID().toString());
        user.setEmail(req.email().toLowerCase().trim());
        user.setUsername(req.username().trim());
        user.setPasswordHash(encoder.encode(req.password()));
        user.setRole(req.role());
        user.setBio(req.bio() != null ? req.bio().trim() : "");
        user.setProfileImageBase64(req.profileImageBase64() != null ? req.profileImageBase64() : "");
        user.setCreatedAt(Instant.now().toString());
        userRepo.save(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(user));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest req) {
        User user = userRepo.findByEmail(req.email().toLowerCase())
            .orElseThrow(() -> new ApiException("Credenciais inválidas.", HttpStatus.UNAUTHORIZED));
        if (!encoder.matches(req.password(), user.getPasswordHash()))
            throw new ApiException("Credenciais inválidas.", HttpStatus.UNAUTHORIZED);
        String token = jwtUtil.generateToken(user.getUserId(), user.getRole(), user.getUsername());
        return ResponseEntity.ok(new LoginResponse(token, "bearer", toResponse(user)));
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(toResponse(user));
    }

    @PutMapping("/profile")
    public ResponseEntity<UserResponse> updateProfile(
        @AuthenticationPrincipal User currentUser,
        @RequestBody UpdateProfileRequest req
    ) {
        if (!req.username().equals(currentUser.getUsername()) && userRepo.existsByUsername(req.username()))
            throw new ApiException("Username já está em uso.", HttpStatus.CONFLICT);

        currentUser.setUsername(req.username().trim());
        currentUser.setBio(req.bio() != null ? req.bio().trim() : "");
        if (req.profileImageBase64() != null) currentUser.setProfileImageBase64(req.profileImageBase64());
        userRepo.save(currentUser);
        return ResponseEntity.ok(toResponse(currentUser));
    }

    private UserResponse toResponse(User u) {
        return new UserResponse(u.getUserId(), u.getEmail(), u.getUsername(),
            u.getRole(), u.getBio(), u.getProfileImageBase64(), u.getCreatedAt());
    }
}
