package com.jobportal.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for login/registration response
 * Contains user details and JWT token
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponse {

    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private String phone;
    private String role;
    private String profileImageUrl;
    private String token;
    private String message;
}
