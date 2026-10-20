
package com.example.jobnova_backend.security;

import java.io.IOException;
import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import com.example.jobnova_backend.entity.User;
import com.example.jobnova_backend.repository.UserRepository;
import com.example.jobnova_backend.service.JwtService;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(
            JwtService jwtService,
            UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        String header = request.getHeader("Authorization");

        // No access token: let Spring Security decide whether the route is public.
        if (header == null || !header.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = header.substring(7);

        try {
            Claims claims = jwtService.validateAccessToken(token);
            Object claimValue = claims.get("userId");

            Long userId;

            if (claimValue instanceof Number number) {
                userId = number.longValue();
            } else if (claimValue instanceof String value) {
                userId = Long.parseLong(value);
            } else {
                writeError(response, 403, "Invalid token");
                return;
            }

            User user = userRepository.findById(userId).orElse(null);

            if (user == null) {
                writeError(response, 401, "User not found");
                return;
            }

            String role = user.getRole();

            var authorities = List.of(
                new SimpleGrantedAuthority(
                    "ROLE_" + role.toUpperCase()
                )
            );

            var authentication =
                new UsernamePasswordAuthenticationToken(
                    user,
                    null,
                    authorities
                );

            SecurityContextHolder.getContext()
                .setAuthentication(authentication);

            filterChain.doFilter(request, response);

        } catch (ExpiredJwtException ex) {
            SecurityContextHolder.clearContext();
            writeError(response, 401, "Token expired");

        } catch (JwtException | IllegalArgumentException ex) {
            SecurityContextHolder.clearContext();
            writeError(response, 403, "Invalid token");
        }
    }

    private void writeError(
            HttpServletResponse response,
            int status,
            String message) throws IOException {

        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");

        response.getWriter().write(
            "{\"success\":false,\"message\":\"" + message + "\"}"
        );
    }
}
