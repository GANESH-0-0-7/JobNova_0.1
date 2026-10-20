
package com.example.jobnova_backend.controller;

import com.example.jobnova_backend.entity.User;
import com.example.jobnova_backend.repository.UserRepository;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class LogoutController {

    private final UserRepository userRepository;

    public LogoutController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout(
            HttpServletRequest request,
            HttpServletResponse response) {

        try {
            String refreshToken = null;

            if (request.getCookies() != null) {
                for (var cookie : request.getCookies()) {
                    if ("jwt".equals(cookie.getName())) {
                        refreshToken = cookie.getValue();
                        break;
                    }
                }
            }

            if (refreshToken != null && !refreshToken.isBlank()) {
                // Make a final copy for use inside the lambda.
                final String tokenToRemove = refreshToken;

                Optional<User> userOptional =
                        userRepository.findByRefreshTokensContaining(
                                tokenToRemove
                        );

                if (userOptional.isPresent()) {
                    User user = userOptional.get();

                    user.getRefreshTokens().removeIf(
                            token -> tokenToRemove.equals(token)
                    );

                    userRepository.save(user);
                }
            }

            ResponseCookie clearCookie = ResponseCookie.from("jwt", "")
                    .httpOnly(true)
                    .secure(isProduction())
                    .sameSite("None")
                    .path("/")
                    .maxAge(0)
                    .build();

            response.addHeader("Set-Cookie", clearCookie.toString());

            Map<String, Object> body = new LinkedHashMap<>();
            body.put("success", true);
            body.put("message", "Logged out successfully");

            return ResponseEntity.ok(body);

        } catch (Exception ex) {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("success", false);
            body.put("message", "Logout failed");

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(body);
        }
    }

    private boolean isProduction() {
        return "production".equalsIgnoreCase(
                System.getenv("NODE_ENV")
        );
    }
}
