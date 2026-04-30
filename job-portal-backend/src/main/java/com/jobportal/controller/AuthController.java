package com.jobportal.controller;

import com.jobportal.dto.LoginRequest;
import com.jobportal.dto.LoginResponse;
import com.jobportal.dto.RegisterRequest;
import com.jobportal.entity.User;
import com.jobportal.security.JwtUtil;
import com.jobportal.service.EmailService;
import com.jobportal.service.NotificationService;
import com.jobportal.service.UserService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")              // ✅ was "/api/auth" — context-path already adds /api
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Authentication", description = "User registration, login, and token management")
public class AuthController {

    private final UserService userService;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;
    private final NotificationService notificationService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest registerRequest) {
        try {
            if (registerRequest.getEmail() == null || registerRequest.getEmail().trim().isEmpty())
                return ResponseEntity.badRequest().body(createErrorResponse("Email is required"));
            if (registerRequest.getPassword() == null || registerRequest.getPassword().length() < 6)
                return ResponseEntity.badRequest().body(createErrorResponse("Password must be at least 6 characters"));
            if (registerRequest.getFirstName() == null || registerRequest.getFirstName().trim().isEmpty())
                return ResponseEntity.badRequest().body(createErrorResponse("First name is required"));
            if (registerRequest.getLastName() == null || registerRequest.getLastName().trim().isEmpty())
                return ResponseEntity.badRequest().body(createErrorResponse("Last name is required"));
            if (userService.emailExists(registerRequest.getEmail()))
                return ResponseEntity.status(HttpStatus.CONFLICT).body(createErrorResponse("Email already registered"));

            User user = new User();
            user.setEmail(registerRequest.getEmail());
            user.setPassword(registerRequest.getPassword());
            user.setFirstName(registerRequest.getFirstName());
            user.setLastName(registerRequest.getLastName());
            user.setPhone(registerRequest.getPhone());
            user.setRole(registerRequest.getRole());

            User registeredUser = userService.registerUser(user);
            String token = jwtUtil.generateToken(registeredUser);

            notificationService.sendNotification(
                    registeredUser.getId(),
                    "Welcome to Job Portal!",
                    "Your account has been created successfully. Explore your dashboard to get started.",
                    "SUCCESS"
            );

            emailService.sendWelcomeEmail(
                    registeredUser.getEmail(),
                    registeredUser.getFirstName(),
                    registeredUser.getRole().toString()
            );

            LoginResponse response = LoginResponse.builder()
                    .id(registeredUser.getId())
                    .email(registeredUser.getEmail())
                    .firstName(registeredUser.getFirstName())
                    .lastName(registeredUser.getLastName())
                    .phone(registeredUser.getPhone())
                    .role(registeredUser.getRole().toString())
                    .profileImageUrl(registeredUser.getProfileImageUrl())
                    .token(token)
                    .message("Registration successful")
                    .build();

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (Exception e) {
            log.error("Registration error", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        try {
            if (loginRequest.getEmail() == null || loginRequest.getEmail().trim().isEmpty())
                return ResponseEntity.badRequest().body(createErrorResponse("Email is required"));
            if (loginRequest.getPassword() == null || loginRequest.getPassword().isEmpty())
                return ResponseEntity.badRequest().body(createErrorResponse("Password is required"));

            // ✅ Use verifyCredentials + getUserByEmail (loginUser doesn't exist)
            boolean valid = userService.verifyCredentials(loginRequest.getEmail(), loginRequest.getPassword());
            if (!valid) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse("Invalid email or password"));
            }

            User user = userService.getUserByEmail(loginRequest.getEmail());
            String token = jwtUtil.generateToken(user);

            LoginResponse response = LoginResponse.builder()
                    .id(user.getId())
                    .email(user.getEmail())
                    .firstName(user.getFirstName())
                    .lastName(user.getLastName())
                    .phone(user.getPhone())
                    .role(user.getRole().toString())
                    .profileImageUrl(user.getProfileImageUrl())
                    .token(token)
                    .message("Login successful")
                    .build();

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Login error", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(e.getMessage()));
        }
    }

    @PostMapping("/validate-token")
    public ResponseEntity<?> validateToken(@RequestHeader("Authorization") String token) {
        try {
            String jwtToken = token.startsWith("Bearer ") ? token.substring(7) : token;

            if (jwtUtil.validateToken(jwtToken)) {
                Map<String, Object> response = new HashMap<>();
                response.put("valid", true);
                response.put("userId", jwtUtil.extractUserId(jwtToken));
                response.put("email", jwtUtil.extractEmail(jwtToken));
                response.put("role", jwtUtil.extractRole(jwtToken));
                response.put("message", "Token is valid");
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse("Token is invalid or expired"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(createErrorResponse("Token validation failed: " + e.getMessage()));
        }
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<?> refreshToken(@RequestHeader("Authorization") String token) {
        try {
            String jwtToken = token.startsWith("Bearer ") ? token.substring(7) : token;

            if (!jwtUtil.validateToken(jwtToken))
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse("Token is invalid or expired"));

            Long userId = jwtUtil.extractUserId(jwtToken);
            User user = userService.getUserById(userId);   // ✅ returns User directly
            String newToken = jwtUtil.generateToken(user);

            Map<String, Object> response = new HashMap<>();
            response.put("token", newToken);
            response.put("message", "Token refreshed successfully");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Token refresh failed: " + e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader("Authorization") String token) {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Logout successful");
        response.put("status", "success");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/request-change-otp")
    public ResponseEntity<?> requestChangeOTP(@RequestHeader("Authorization") String token) {
        try {
            String jwtToken = token.startsWith("Bearer ") ? token.substring(7) : token;
            if (!jwtUtil.validateToken(jwtToken))
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(createErrorResponse("Invalid session"));

            Long userId = jwtUtil.extractUserId(jwtToken);
            User user = userService.getUserById(userId);
            String otp = userService.initiateChangePasswordOTP(userId);
            
            boolean sent = emailService.sendOTPEmail(user.getEmail(), user.getFirstName(), otp, "Account Security (Password Change)");
            if (!sent) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(createErrorResponse("Failed to send verification email. Please contact support or try again later."));
            }

            Map<String, String> response = new HashMap<>();
            response.put("message", "Verification code sent to " + user.getEmail());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Request change OTP error", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to send verification code"));
        }
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestHeader("Authorization") String token,
                                            @RequestBody Map<String, String> body) {
        try {
            String jwtToken = token.startsWith("Bearer ") ? token.substring(7) : token;
            if (!jwtUtil.validateToken(jwtToken))
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse("Token is invalid or expired"));

            Long userId = jwtUtil.extractUserId(jwtToken);
            String currentPassword = body.get("currentPassword");
            String newPassword = body.get("newPassword");
            String otp = body.get("otp");

            if (currentPassword == null || currentPassword.isEmpty())
                return ResponseEntity.badRequest().body(createErrorResponse("Current password is required"));
            if (newPassword == null || newPassword.length() < 6)
                return ResponseEntity.badRequest().body(createErrorResponse("New password must be at least 6 characters"));
            if (otp == null || otp.isEmpty())
                return ResponseEntity.badRequest().body(createErrorResponse("Verification code is required"));

            userService.changePasswordWithOTP(userId, currentPassword, newPassword, otp);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Password changed successfully");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Change password error", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(createErrorResponse(e.getMessage()));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        try {
            String email = body.get("email");
            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(createErrorResponse("Email is required"));
            }

            if (!userService.emailExists(email)) {
                // Return success even if email doesn't exist for security
                Map<String, String> response = new HashMap<>();
                response.put("message", "If an account with that email exists, a verification code has been sent.");
                return ResponseEntity.ok(response);
            }

            String otp = userService.initiatePasswordReset(email);
            User user = userService.getUserByEmail(email);
            
            // Send email
            boolean sent = emailService.sendOTPEmail(email, user.getFirstName(), otp, "Password Reset Request");
            if (!sent) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(createErrorResponse("Failed to send reset email. The mail server might be down."));
            }

            Map<String, String> response = new HashMap<>();
            response.put("message", "Verification code sent to your email.");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Forgot password error", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to initiate password reset: " + e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        try {
            String email = body.get("email");
            String otp = body.get("otp");
            String newPassword = body.get("newPassword");

            if (email == null || email.isEmpty())
                return ResponseEntity.badRequest().body(createErrorResponse("Email is required"));
            if (otp == null || otp.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(createErrorResponse("Verification code is required"));
            }
            if (newPassword == null || newPassword.length() < 6) {
                return ResponseEntity.badRequest().body(createErrorResponse("New password must be at least 6 characters"));
            }

            userService.resetPasswordByOTP(email, otp, newPassword);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Password has been reset successfully.");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Reset password error", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(createErrorResponse(e.getMessage()));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@RequestHeader("Authorization") String token) {
        try {
            String jwtToken = token.startsWith("Bearer ") ? token.substring(7) : token;

            if (!jwtUtil.validateToken(jwtToken))
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse("Token is invalid or expired"));

            Long userId = jwtUtil.extractUserId(jwtToken);
            User user = userService.getUserById(userId);   // ✅ returns User directly

            LoginResponse response = LoginResponse.builder()
                    .id(user.getId())
                    .email(user.getEmail())
                    .firstName(user.getFirstName())
                    .lastName(user.getLastName())
                    .phone(user.getPhone())
                    .role(user.getRole().toString())
                    .profileImageUrl(user.getProfileImageUrl())
                    .message("User details retrieved successfully")
                    .build();

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Error retrieving user details"));
        }
    }

    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> error = new HashMap<>();
        error.put("error", message);
        error.put("status", "error");
        error.put("timestamp", System.currentTimeMillis());
        return error;
    }
}
