package com.jobportal.controller;

import com.jobportal.entity.Notification;
import com.jobportal.exception.CustomException;
import com.jobportal.exception.ResourceNotFoundException;
import com.jobportal.repository.NotificationRepository;
import com.jobportal.security.SecurityUtil;
import com.jobportal.service.NotificationService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "In-app notification management")
public class NotificationController {

    private final NotificationService notificationService;
    private final NotificationRepository notificationRepository;
    private final SecurityUtil securityUtil;

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Notification>> getUserNotifications(@PathVariable Long userId, HttpServletRequest request) {
        Long currentUserId = securityUtil.getCurrentUserId(request);
        if (!currentUserId.equals(userId)) {
            throw new CustomException("Access denied", HttpStatus.FORBIDDEN);
        }
        return ResponseEntity.ok(notificationService.getUserNotifications(userId));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id, HttpServletRequest request) {
        Long currentUserId = securityUtil.getCurrentUserId(request);
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", id));
        if (!notification.getUser().getId().equals(currentUserId)) {
            throw new CustomException("Access denied", HttpStatus.FORBIDDEN);
        }
        notificationService.markAsRead(id);
        return ResponseEntity.ok().build();
    }
}
