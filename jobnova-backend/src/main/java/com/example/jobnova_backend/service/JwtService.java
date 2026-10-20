
package com.example.jobnova_backend.service;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Map;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

    private final SecretKey accessKey;
    private final SecretKey refreshKey;

    public JwtService(
            @Value("${app.jwt.secret}") String accessSecret,
            @Value("${app.jwt.refresh-secret}") String refreshSecret) {

        this.accessKey = createKey(accessSecret);
        this.refreshKey = createKey(refreshSecret);
    }

    private SecretKey createKey(String secret) {
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);

        if (bytes.length < 32) {
            throw new IllegalArgumentException(
                    "JWT secrets must contain at least 32 UTF-8 bytes"
            );
        }

        return Keys.hmacShaKeyFor(bytes);
    }

    public String generateAccessToken(Long userId) {
        return generateToken(userId, accessKey, 15 * 60 * 1000L);
    }

    public String generateRefreshToken(Long userId) {
        return generateToken(
                userId, refreshKey, 7 * 24 * 60 * 60 * 1000L
        );
    }

    private String generateToken(
            Long userId, SecretKey key, long validityMillis) {

        Instant now = Instant.now();

        return Jwts.builder()
                .claims(Map.of("userId", userId))
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(validityMillis)))
                .signWith(key)
                .compact();
    }

    public Claims validateAccessToken(String token) {
        return parseToken(token, accessKey);
    }

    public Claims validateRefreshToken(String token) {
        return parseToken(token, refreshKey);
    }

    public Long getUserIdFromToken(String token) {
        Claims claims = validateRefreshToken(token);
        Object userId = claims.get("userId");

        if (userId instanceof Number number) {
            return number.longValue();
        }

        if (userId instanceof String value) {
            return Long.parseLong(value);
        }

        return null;
    }

    private Claims parseToken(String token, SecretKey key) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
