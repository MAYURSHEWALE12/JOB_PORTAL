package com.jobportal.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * ResourceNotFoundException - Thrown when a requested resource doesn't exist
 *
 * Examples:
 *   - User not found by ID
 *   - Job not found by ID
 *   - Application not found by ID
 *
 * Automatically returns HTTP 404 NOT FOUND response.
 *
 * Usage:
 *   throw new ResourceNotFoundException("User", "id", 5);
 *   → "User not found with id : 5"
 *
 *   throw new ResourceNotFoundException("Job", "id", 10);
 *   → "Job not found with id : 10"
 *
 *   throw new ResourceNotFoundException("User", "email", "john@email.com");
 *   → "User not found with email : john@email.com"
 */
@ResponseStatus(HttpStatus.NOT_FOUND)
public class ResourceNotFoundException extends RuntimeException {

    private final String resourceName;
    private final String fieldName;
    private final Object fieldValue;

    public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        super(String.format("%s not found with %s : %s", resourceName, fieldName, fieldValue));
        this.resourceName = resourceName;
        this.fieldName = fieldName;
        this.fieldValue = fieldValue;
    }

    public String getResourceName() { return resourceName; }
    public String getFieldName()    { return fieldName; }
    public Object getFieldValue()   { return fieldValue; }
}