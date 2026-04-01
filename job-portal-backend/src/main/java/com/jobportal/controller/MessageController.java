package com.jobportal.controller;

import com.jobportal.dto.UserDTO;
import com.jobportal.entity.Message;
import com.jobportal.entity.User;
import com.jobportal.exception.CustomException;
import com.jobportal.exception.ResourceNotFoundException;
import com.jobportal.repository.MessageRepository;
import com.jobportal.repository.UserRepository;
import com.jobportal.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/messages")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "http://localhost:5173")
public class MessageController {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    /**
     * POST /api/messages/send
     * Send a message
     */
    @PostMapping("/send")
    public ResponseEntity<Message> sendMessage(
            @RequestParam Long senderId,
            @RequestParam Long receiverId,
            @RequestBody Map<String, String> body) {

        String content = body.get("content");
        if (content == null || content.trim().isEmpty()) {
            throw new CustomException("Message content cannot be empty", HttpStatus.BAD_REQUEST);
        }

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", senderId));
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", receiverId));

        if (senderId.equals(receiverId)) {
            throw new CustomException("Cannot send message to yourself", HttpStatus.BAD_REQUEST);
        }

        Message message = Message.builder()
                .sender(sender)
                .receiver(receiver)
                .content(content.trim())
                .build();

        Message saved = messageRepository.save(message);
        log.info("Message sent from {} to {}", senderId, receiverId);

        // Notify receiver
        String snippet = content.length() > 40 ? content.substring(0, 40) + "..." : content;
        notificationService.sendNotification(
                receiver.getId(),
                "New message from " + sender.getFirstName() + " \uD83D\uDCAC",
                snippet,
                "MESSAGE",
                sender.getId(),
                "CONVERSATION"
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    /**
     * GET /api/messages/conversation?userId=1&partnerId=2
     * Get full conversation between two users
     */
    @GetMapping("/conversation")
    public ResponseEntity<List<Message>> getConversation(
            @RequestParam Long userId,
            @RequestParam Long partnerId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        User partner = userRepository.findById(partnerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", partnerId));

        // Mark messages as read
        messageRepository.markAsRead(partner, user);

        return ResponseEntity.ok(messageRepository.findConversation(user, partner));
    }

    /**
     * GET /api/messages/inbox?userId=1
     * Get all conversation partners with latest message
     */
    @GetMapping("/inbox")
    public ResponseEntity<List<Map<String, Object>>> getInbox(@RequestParam Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        List<User> partners = messageRepository.findConversationPartners(user);
        List<Map<String, Object>> inbox = new ArrayList<>();

        for (User partner : partners) {
            List<Message> messages = messageRepository.findLatestMessage(user, partner);
            if (!messages.isEmpty()) {
                Message latest = messages.get(0);
                long unread = messageRepository.countByReceiverAndIsReadFalse(user);

                inbox.add(Map.of(
                        "partner",       UserDTO.fromEntity(partner),
                        "latestMessage", latest,
                        "unreadCount",   unread
                ));
            }
        }

        return ResponseEntity.ok(inbox);
    }

    /**
     * GET /api/messages/unread-count?userId=1
     * Get unread message count
     */
    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount(@RequestParam Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        long count = messageRepository.countByReceiverAndIsReadFalse(user);
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    /**
     * GET /api/messages/users?userId=1
     * Get all users to message (everyone except self)
     */
    @GetMapping("/users")
    public ResponseEntity<List<UserDTO>> getUsersToMessage(@RequestParam Long userId) {
        List<UserDTO> allUsers = userRepository.findAll().stream()
                .filter(u -> !u.getId().equals(userId))
                .map(UserDTO::fromEntity)
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(allUsers);
    }
}
