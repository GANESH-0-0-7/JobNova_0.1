
package com.example.jobnova_backend.security;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import com.example.jobnova_backend.entity.User;

@Component
public class RoleAuthorization {

    public User requireAuthenticatedUser() {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof User user)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Authentication required"
            );
        }

        return user;
    }

    public User requireRole(String... allowedRoles) {
        User user = requireAuthenticatedUser();

        Set<String> roles = Arrays.stream(allowedRoles)
                .map(String::toLowerCase)
                .collect(Collectors.toSet());

        if (!roles.contains(user.getRole().toLowerCase())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Access denied"
            );
        }

        return user;
    }
}
