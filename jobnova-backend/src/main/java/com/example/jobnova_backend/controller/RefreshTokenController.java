
package com.example.jobnova_backend.controller;

import com.example.jobnova_backend.entity.User;
import com.example.jobnova_backend.repository.UserRepository;
import com.example.jobnova_backend.service.JwtService;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class RefreshTokenController {

    private final UserRepository userRepository;
    private final JwtService jwtService;

    public RefreshTokenController(
            UserRepository userRepository,
            JwtService jwtService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }

    @PostMapping("/refresh")
    public ResponseEntity<Map<String, Object>> handleRefreshToken(
            HttpServletRequest request,
            HttpServletResponse response) {

        String refreshToken = null;

        if (request.getCookies() != null) {
            for (var cookie : request.getCookies()) {
                if ("jwt".equals(cookie.getName())) {
                    refreshToken = cookie.getValue();
                    break;
                }
            }
        }

        if (refreshToken == null || refreshToken.isBlank()) {
            clearRefreshCookie(response);
            return result(
                    HttpStatus.UNAUTHORIZED,
                    "Unauthorized: No refresh token"
            );
        }

        Claims claims = null;

        try {
            claims = jwtService.validateRefreshToken(refreshToken);
        } catch (JwtException | IllegalArgumentException ex) {
            // Invalid or expired tokens are handled below.
        }

        boolean validToken = claims != null;

        Optional<User> matchingUser =
                userRepository.findByRefreshTokensContaining(refreshToken);

        if (matchingUser.isEmpty()) {
            clearRefreshCookie(response);

            // A valid but revoked token may indicate token reuse.
            if (validToken) {
                Long userId = extractUserId(claims);

                if (userId != null) {
                    userRepository.findById(userId).ifPresent(user -> {
                        user.getRefreshTokens().clear();
                        userRepository.save(user);
                    });
                }
            }

            return result(
                    HttpStatus.FORBIDDEN,
                    "Forbidden: Invalid refresh token"
            );
        }

        User user = matchingUser.get();

        List<String> remainingTokens =
                new ArrayList<>(user.getRefreshTokens());

        remainingTokens.removeIf(refreshToken::equals);
        user.setRefreshTokens(remainingTokens);

        if (!validToken) {
            userRepository.save(user);
            clearRefreshCookie(response);

            return result(
                    HttpStatus.FORBIDDEN,
                    "Forbidden: Invalid or expired refresh token"
            );
        }

        Long tokenUserId = extractUserId(claims);

        if (tokenUserId == null
                || user.getId() == null
                || !user.getId().equals(tokenUserId)) {

            userRepository.save(user);
            clearRefreshCookie(response);

            return result(
                    HttpStatus.FORBIDDEN,
                    "Forbidden: Invalid or expired refresh token"
            );
        }

        String accessToken =
                jwtService.generateAccessToken(user.getId());

        String newRefreshToken =
                jwtService.generateRefreshToken(user.getId());

        user.getRefreshTokens().add(newRefreshToken);
        userRepository.save(user);

        clearRefreshCookie(response);
        setRefreshCookie(response, newRefreshToken);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("token", accessToken);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", true);
        body.put("data", data);

        return ResponseEntity.ok(body);
    }

    private Long extractUserId(Claims claims) {
        if (claims == null) {
            return null;
        }

        Object userId = claims.get("userId");

        if (userId instanceof Number number) {
            return number.longValue();
        }

        if (userId instanceof String value) {
            try {
                return Long.parseLong(value);
            } catch (NumberFormatException ex) {
                return null;
            }
        }

        return null;
    }

    private ResponseEntity<Map<String, Object>> result(
            HttpStatus status,
            String message) {

        return ResponseEntity.status(status).body(Map.of(
                "success", false,
                "message", message
        ));
    }

    private void clearRefreshCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from("jwt", "")
                .httpOnly(true)
                .secure(isProduction())
                .sameSite("None")
                .path("/")
                .maxAge(0)
                .build();

        response.addHeader("Set-Cookie", cookie.toString());
    }

    private void setRefreshCookie(
            HttpServletResponse response,
            String refreshToken) {

        ResponseCookie cookie = ResponseCookie.from("jwt", refreshToken)
                .httpOnly(true)
                .secure(isProduction())
                .sameSite("None")
                .path("/")
                .maxAge(7 * 24 * 60 * 60)
                .build();

        response.addHeader("Set-Cookie", cookie.toString());
    }

    private boolean isProduction() {
        return "production".equalsIgnoreCase(
                System.getenv("NODE_ENV")
        );
    }
}
