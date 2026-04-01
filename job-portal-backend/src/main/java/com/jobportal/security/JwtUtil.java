package com.jobportal.security;

import com.jobportal.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Component
@Slf4j
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${jwt.expiration}")
    private long expirationTime;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secretKey.getBytes());
    }

    public String generateToken(User user) {
        return generateToken(user.getId(), user.getEmail(), user.getRole().toString());
    }

    private String generateToken(Long userId, String email, String role) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        claims.put("email", email);
        if (role != null) claims.put("role", role);

        return Jwts.builder()
                .claims(claims)
                .subject(userId.toString())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expirationTime))
                .signWith(getSigningKey())
                .compact();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(token);
            return true;
        } catch (Exception e) {
            log.error("JWT validation failed: {}", e.getMessage());
            return false;
        }
    }

    public Long extractUserId(String token) {
        return getAllClaims(token).get("userId", Long.class);
    }

    public String extractEmail(String token) {
        return getAllClaims(token).getSubject();
    }

    // ✅ Called by AuthController /validate-token
    public String extractRole(String token) {
        return getAllClaims(token).get("role", String.class);
    }

    public boolean isTokenExpired(String token) {
        try {
            return getAllClaims(token).getExpiration().before(new Date());
        } catch (Exception e) {
            return true;
        }
    }

    private Claims getAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}