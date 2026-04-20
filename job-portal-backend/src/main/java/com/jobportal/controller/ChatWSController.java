package com.jobportal.controller;

import com.jobportal.entity.Message;
import com.jobportal.entity.User;
import com.jobportal.repository.MessageRepository;
import com.jobportal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

@Controller
@RequiredArgsConstructor
@Slf4j
public class ChatWSController {

    private final SimpMessagingTemplate messagingTemplate;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    /**
     * Handles typing status updates.
     * Payload: { "receiverId": 123, "senderId": 456, "isTyping": true }
     */
    @MessageMapping("/chat.typing")
    public void handleTyping(Map<String, Object> payload) {
        Long receiverId = Long.valueOf(payload.get("receiverId").toString());
        Long senderId = Long.valueOf(payload.get("senderId").toString());
        boolean isTyping = (boolean) payload.get("isTyping");

        // Broadcast to the receiver
        messagingTemplate.convertAndSend("/topic/typing/" + receiverId, (Object) Map.of(
                "userId", senderId,
                "isTyping", isTyping
        ));
    }

    /**
     * Handles real-time read receipts.
     * Payload: { "partnerId": 123, "viewerId": 456 }
     */
    @MessageMapping("/chat.read")
    @Transactional
    public void handleReadReceipt(Map<String, Object> payload) {
        Long partnerId = Long.valueOf(payload.get("partnerId").toString());
        Long viewerId = Long.valueOf(payload.get("viewerId").toString());

        User partner = userRepository.findById(partnerId).orElse(null);
        User viewer = userRepository.findById(viewerId).orElse(null);

        if (partner != null && viewer != null) {
            // Update database
            messageRepository.markAsRead(partner, viewer);
            
            // Broadcast "READ" event to the partner (the original sender)
            messagingTemplate.convertAndSend("/topic/chat.read/" + partnerId, (Object) Map.of(
                    "readerId", viewerId,
                    "readAt", LocalDateTime.now().toString()
            ));
            
            log.debug("User {} read messages from user {}", viewerId, partnerId);
        }
    }
}
