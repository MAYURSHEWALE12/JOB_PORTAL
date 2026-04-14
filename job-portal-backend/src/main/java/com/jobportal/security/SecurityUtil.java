package com.jobportal.security;

import com.jobportal.entity.UserRole;
import com.jobportal.exception.CustomException;
import com.jobportal.security.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class SecurityUtil {

    private final JwtUtil jwtUtil;

    public Long getCurrentUserId(HttpServletRequest request) {
        Object userId = request.getAttribute("userId");
        if (userId == null) {
            throw new CustomException("Authentication required", HttpStatus.UNAUTHORIZED);
        }
        return (Long) userId;
    }

    public Long getUserIdFromToken(String token) {
        if (!jwtUtil.validateToken(token)) {
            throw new CustomException("Invalid or expired token", HttpStatus.UNAUTHORIZED);
        }
        return jwtUtil.extractUserId(token);
    }

    public UserRole getCurrentUserRole(HttpServletRequest request) {
        Object role = request.getAttribute("userRole");
        if (role == null) {
            throw new CustomException("Authentication required", HttpStatus.UNAUTHORIZED);
        }
        return (UserRole) role;
    }

    public String getCurrentUserEmail(HttpServletRequest request) {
        Object email = request.getAttribute("userEmail");
        if (email == null) {
            throw new CustomException("Authentication required", HttpStatus.UNAUTHORIZED);
        }
        return (String) email;
    }

    public void requireRole(HttpServletRequest request, UserRole requiredRole) {
        UserRole currentRole = getCurrentUserRole(request);
        if (currentRole != requiredRole && currentRole != UserRole.ADMIN) {
            throw new CustomException("Requires " + requiredRole + " role", HttpStatus.FORBIDDEN);
        }
    }

    public void requireEmployer(HttpServletRequest request) {
        requireRole(request, UserRole.EMPLOYER);
    }

    public void requireJobSeeker(HttpServletRequest request) {
        requireRole(request, UserRole.JOBSEEKER);
    }
}
