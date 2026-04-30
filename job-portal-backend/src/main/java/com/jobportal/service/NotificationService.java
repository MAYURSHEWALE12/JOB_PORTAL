package com.jobportal.service;

import com.jobportal.entity.Notification;
import com.jobportal.entity.User;
import com.jobportal.exception.ResourceNotFoundException;
import com.jobportal.repository.NotificationRepository;
import com.jobportal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;

    public Notification sendNotification(Long userId, String title, String message, String type) {
        return sendNotification(userId, title, message, type, null, null);
    }

    public Notification sendNotification(Long userId, String title, String message, String type, Long referenceId, String referenceType) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        
        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .type(type)
                .referenceId(referenceId)
                .referenceType(referenceType)
                .build();
        
        Notification saved = notificationRepository.save(notification);
        
        messagingTemplate.convertAndSend("/topic/notifications/" + userId, saved);
        
        return saved;
    }
    
    public List<Notification> getUserNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }
    
    public void markAsRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(notification -> {
            notification.setRead(true);
            notificationRepository.save(notification);
        });
    }

    @org.springframework.transaction.annotation.Transactional
    public void markAllAsRead(Long userId) {
        List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        notifications.forEach(notification -> notification.setRead(true));
        notificationRepository.saveAll(notifications);
    }

    @org.springframework.transaction.annotation.Transactional
    public void clearAllNotifications(Long userId) {
        notificationRepository.deleteByUserId(userId);
    }

    public void broadcastNotification(String title, String message, String type) {
        // We broadcast to a global topic. Note: This is NOT saved to DB for everyone 
        // to keep it lightweight. Only active users see it.
        messagingTemplate.convertAndSend("/topic/notifications/all", 
            java.util.Map.of(
                "title", title,
                "message", message,
                "type", type,
                "timestamp", java.time.LocalDateTime.now().toString(),
                "isBroadcast", true
            )
        );
    }
}
