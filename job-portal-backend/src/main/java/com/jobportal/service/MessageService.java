package com.jobportal.service;

import com.jobportal.entity.Message;
import com.jobportal.entity.User;
import com.jobportal.repository.MessageRepository;
import com.jobportal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationService notificationService;

    @Transactional
    public Message sendMessage(Long senderId, Long receiverId, String content, String messageType, String fileUrl, String fileName) {
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("Sender not found"));
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new RuntimeException("Receiver not found"));

        Message message = Message.builder()
                .sender(sender)
                .receiver(receiver)
                .content(content)
                .messageType(messageType != null ? messageType : "TEXT")
                .fileUrl(fileUrl)
                .fileName(fileName)
                .isRead(false)
                .build();

        Message saved = messageRepository.save(message);
        log.info("Message saved: {} -> {} (type: {})", senderId, receiverId, saved.getMessageType());

        // Push message to receiver via WebSocket
        messagingTemplate.convertAndSend("/topic/messages/" + receiverId, saved);

        // Also send back to sender for confirmation
        messagingTemplate.convertAndSend("/topic/messages/" + senderId, saved);

        // Send notification
        String snippet = "TEXT".equals(saved.getMessageType())
                ? (content.length() > 40 ? content.substring(0, 40) + "..." : content)
                : "📎 " + (fileName != null ? fileName : "File attachment");

        notificationService.sendNotification(
                receiverId,
                "New message from " + sender.getFirstName() + " 💬",
                snippet,
                "MESSAGE",
                senderId,
                "CONVERSATION"
        );

        return saved;
    }

    @Transactional
    public void markAsRead(Long userId, Long partnerId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        User partner = userRepository.findById(partnerId)
                .orElseThrow(() -> new RuntimeException("Partner not found"));

        messageRepository.markAsRead(partner, user);

        // Notify sender that their messages were read
        HashMap<String, Object> receipt = new HashMap<>();
        receipt.put("readerId", userId);
        receipt.put("partnerId", partnerId);
        receipt.put("timestamp", LocalDateTime.now());
        messagingTemplate.convertAndSend("/topic/read-receipts/" + partnerId, (Object) receipt);
    }

    @Transactional
    public void sendTypingIndicator(Long userId, Long partnerId, boolean isTyping) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        HashMap<String, Object> typing = new HashMap<>();
        typing.put("userId", userId);
        typing.put("userName", user.getFirstName() + " " + user.getLastName());
        typing.put("isTyping", isTyping);
        messagingTemplate.convertAndSend("/topic/typing/" + partnerId, (Object) typing);
    }
}
