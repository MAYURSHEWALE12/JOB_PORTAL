package com.jobportal.dto;

import com.jobportal.entity.User;
import com.jobportal.entity.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * UserDTO - Data Transfer Object for User
 *
 * WHY use a DTO instead of returning the User entity directly?
 *   - SECURITY: Hides sensitive fields like 'password' from API responses
 *   - CONTROL:  You decide exactly what the frontend receives
 *   - SAFETY:   Prevents accidental exposure of internal fields
 *
 * Rule of thumb:
 *   Entity  → database layer  (has password, internal fields)
 *   DTO     → API layer       (safe to send to frontend)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDTO {

    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private String phone;
    private UserRole role;
    private String profileImageUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // -------------------------------------------------------
    // Static factory method: convert User entity → UserDTO
    // Use this everywhere you need to return a user in an API
    // -------------------------------------------------------

    /**
     * Convert a User entity into a safe UserDTO (no password!)
     *
     * Usage:
     *   User user = userRepository.findById(id);
     *   UserDTO dto = UserDTO.fromEntity(user);
     *   return ResponseEntity.ok(dto);
     */
    public static UserDTO fromEntity(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phone(user.getPhone())
                .role(user.getRole())
                .profileImageUrl(user.getProfileImageUrl())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
        // NOTE: password is intentionally NOT included here
    }
}