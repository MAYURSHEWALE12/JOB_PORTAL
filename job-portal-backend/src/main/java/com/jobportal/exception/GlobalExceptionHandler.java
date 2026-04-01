package com.jobportal.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(CustomException.class)
    public ResponseEntity<Map<String, Object>> handleCustomException(CustomException ex) {
        Map<String, Object> response = new HashMap<>();
        response.put("error", ex.getMessage());
        response.put("status", ex.getStatus().value());
        response.put("timestamp", LocalDateTime.now().toString());
        return ResponseEntity.status(ex.getStatus()).body(response);
    }

    // ✅ Added
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleResourceNotFoundException(ResourceNotFoundException ex) {
        Map<String, Object> response = new HashMap<>();
        response.put("error", ex.getMessage());
        response.put("resource", ex.getResourceName());
        response.put("field", ex.getFieldName());
        response.put("value", ex.getFieldValue());
        response.put("status", HttpStatus.NOT_FOUND.value());
        response.put("timestamp", LocalDateTime.now().toString());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    // ✅ Added
    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<Map<String, Object>> handleBadRequestException(BadRequestException ex) {
        Map<String, Object> response = new HashMap<>();
        response.put("error", ex.getMessage());
        response.put("status", HttpStatus.BAD_REQUEST.value());
        response.put("timestamp", LocalDateTime.now().toString());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, Object>> handleMaxSizeException(MaxUploadSizeExceededException exc) {
        Map<String, Object> response = new HashMap<>();
        response.put("error", "File is too large! Maximum allowed size is 20MB.");
        response.put("status", HttpStatus.PAYLOAD_TOO_LARGE.value());
        response.put("timestamp", LocalDateTime.now().toString());
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {
        ex.printStackTrace(); // Log full trace to server console
        Map<String, Object> response = new HashMap<>();
        response.put("error", "Server Error: " + ex.getClass().getSimpleName() + " - " + ex.getMessage());
        response.put("details", ex.getMessage());
        response.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
        response.put("timestamp", LocalDateTime.now().toString());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}
