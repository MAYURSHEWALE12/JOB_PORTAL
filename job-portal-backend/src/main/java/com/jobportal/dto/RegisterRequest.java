package com.jobportal.dto;

import com.jobportal.entity.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for user registration request
 * Contains user information needed for registration
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterRequest {

    private String email;
    private String password;
    private String firstName;
    private String lastName;
    private String phone;
    private UserRole role;
}
