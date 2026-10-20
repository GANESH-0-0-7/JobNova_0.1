package com.example.jobnova_backend.controller;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.jobnova_backend.dto.SignInRequest;
import com.example.jobnova_backend.dto.SignUpRequest;
import com.example.jobnova_backend.entity.User;
import com.example.jobnova_backend.repository.UserRepository;
import com.example.jobnova_backend.service.JwtService;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthController(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @PostMapping("/signin")
    public ResponseEntity<Map<String, Object>> signIn(
            @Valid @RequestBody SignInRequest request,
            HttpServletResponse response) {

        User user = userRepository.findByEmail(
                request.getEmail().trim().toLowerCase()
        ).orElse(null);

        if (user == null ||
                !passwordEncoder.matches(
                        request.getPassword(), user.getPassword())) {

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "success", false,
                            "message", "Invalid credentials"
                    ));
        }

        String accessToken = jwtService.generateAccessToken(user.getId());
        String refreshToken = jwtService.generateRefreshToken(user.getId());

        // Store the refresh token on the user.
        user.getRefreshTokens().add(refreshToken);
        userRepository.save(user);

        // Configure the HTTP-only refresh-token cookie.
        ResponseCookie cookie = ResponseCookie.from("jwt", refreshToken)
                .httpOnly(true)
                .secure(isProduction())
                .sameSite("None")
                .path("/")
                .maxAge(7 * 24 * 60 * 60)
                .build();

        response.addHeader("Set-Cookie", cookie.toString());

        Map<String, Object> userData = new LinkedHashMap<>();
        userData.put("id", user.getId());
        userData.put("name", user.getName());
        userData.put("email", user.getEmail());
        userData.put("role", user.getRole());

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("user", userData);
        data.put("token", accessToken);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", data
        ));
    }

    private boolean isProduction() {
        return "production".equalsIgnoreCase(
                System.getenv("NODE_ENV")
        );
    }
    @PostMapping("/signup")
public ResponseEntity<Map<String, Object>> signUp(
        @Valid @RequestBody SignUpRequest request,
        HttpServletResponse response) {

    String email = request.getEmail().trim().toLowerCase();

    if (userRepository.existsByEmail(email)) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of(
                        "success", false,
                        "message", "User already exists"
                ));
    }

    User user = new User();
    user.setName(request.getName().trim());
    user.setEmail(email);
    user.setPassword(passwordEncoder.encode(request.getPassword()));
    user.setRole(request.getRole());

    // Save first so the database generates the user ID.
    user = userRepository.saveAndFlush(user);

    String accessToken = jwtService.generateAccessToken(user.getId());
    String refreshToken = jwtService.generateRefreshToken(user.getId());

    user.getRefreshTokens().add(refreshToken);
    userRepository.save(user);

    ResponseCookie cookie = ResponseCookie.from("jwt", refreshToken)
            .httpOnly(true)
            .secure(isProduction())
            .sameSite("None")
            .path("/")
            .maxAge(7 * 24 * 60 * 60)
            .build();

    response.addHeader("Set-Cookie", cookie.toString());

    Map<String, Object> userData = new LinkedHashMap<>();
    userData.put("id", user.getId());
    userData.put("name", user.getName());
    userData.put("email", user.getEmail());
    userData.put("role", user.getRole());

    Map<String, Object> data = new LinkedHashMap<>();
    data.put("user", userData);
    data.put("token", accessToken);

    return ResponseEntity.status(HttpStatus.CREATED)
            .body(Map.of(
                    "success", true,
                    "data", data
            ));
}
}