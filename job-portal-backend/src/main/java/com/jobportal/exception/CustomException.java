package com.jobportal.exception;

import org.springframework.http.HttpStatus;

/**
 * CustomException - A reusable exception for the entire project
 *
 * Instead of throwing generic RuntimeException("message"),
 * we throw CustomException(message, HttpStatus.NOT_FOUND) etc.
 * so the controller knows exactly what HTTP status to return.
 *
 * Usage examples:
 *   throw new CustomException("User not found", HttpStatus.NOT_FOUND);
 *   throw new CustomException("Email already exists", HttpStatus.CONFLICT);
 *   throw new CustomException("Invalid password", HttpStatus.UNAUTHORIZED);
 *   throw new CustomException("Access denied", HttpStatus.FORBIDDEN);
 */
public class CustomException extends RuntimeException {

    private final HttpStatus status;

    public CustomException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}