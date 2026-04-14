package com.jobportal.controller;

import com.jobportal.entity.Message;
import com.jobportal.entity.MessageReaction;
import com.jobportal.entity.User;
import com.jobportal.repository.MessageReactionRepository;
import com.jobportal.repository.MessageRepository;
import com.jobportal.repository.UserRepository;
import com.jobportal.service.MessageService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;
import java.util.Optional;

@Controller
@RequiredArgsConstructor
@Tag(name = "WebSocket", description = "STOMP WebSocket endpoints for real-time features")
public class MessageWebSocketController {

    private final MessageService messageService;
    private final MessageRepository messageRepository;
    private final MessageReactionRepository reactionRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat.send")
    public void sendMessage(@Payload Map<String, Object> payload) {
        Long senderId = Long.valueOf(payload.get("senderId").toString());
        Long receiverId = Long.valueOf(payload.get("receiverId").toString());
        String content = payload.get("content") != null ? payload.get("content").toString() : "";
        String messageType = payload.get("messageType") != null ? payload.get("messageType").toString() : "TEXT";
        String fileUrl = payload.get("fileUrl") != null ? payload.get("fileUrl").toString() : null;
        String fileName = payload.get("fileName") != null ? payload.get("fileName").toString() : null;

        messageService.sendMessage(senderId, receiverId, content, messageType, fileUrl, fileName);
    }

    @MessageMapping("/typing")
    public void sendTypingIndicator(@Payload Map<String, Object> payload) {
        Long userId = Long.valueOf(payload.get("userId").toString());
        Long partnerId = Long.valueOf(payload.get("partnerId").toString());
        boolean isTyping = Boolean.parseBoolean(payload.get("isTyping").toString());

        messageService.sendTypingIndicator(userId, partnerId, isTyping);
    }

    @MessageMapping("/read-receipt")
    public void sendReadReceipt(@Payload Map<String, Object> payload) {
        Long userId = Long.valueOf(payload.get("userId").toString());
        Long partnerId = Long.valueOf(payload.get("partnerId").toString());

        messageService.markAsRead(userId, partnerId);
    }

    @MessageMapping("/reaction")
    public void handleReaction(@Payload Map<String, Object> payload) {
        Long messageId = Long.valueOf(payload.get("messageId").toString());
        Long userId = Long.valueOf(payload.get("userId").toString());
        String emoji = payload.get("emoji").toString();
        boolean add = Boolean.parseBoolean(payload.get("add").toString());

        Optional<Message> msgOpt = messageRepository.findById(messageId);
        if (msgOpt.isEmpty()) return;
        Message message = msgOpt.get();

        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) return;
        User user = userOpt.get();

        if (add) {
            reactionRepository.findByMessageIdAndUserIdAndEmoji(messageId, userId, emoji)
                .orElseGet(() -> reactionRepository.save(MessageReaction.builder()
                    .message(message)
                    .user(user)
                    .emoji(emoji)
                    .build()));
        } else {
            reactionRepository.deleteByMessageIdAndUserIdAndEmoji(messageId, userId, emoji);
        }

        var reactions = reactionRepository.findByMessageId(messageId);
        var reactionPayload = Map.of(
            "messageId", messageId,
            "reactions", reactions.stream().map(r -> Map.of(
                "emoji", r.getEmoji(),
                "userId", r.getUser().getId(),
                "userName", r.getUser().getFirstName() + " " + r.getUser().getLastName()
            )).toList()
        );

        Long receiverId = message.getReceiver().getId();
        Long senderId = message.getSender().getId();
        messagingTemplate.convertAndSend("/topic/reactions/" + receiverId, (Object) reactionPayload);
        messagingTemplate.convertAndSend("/topic/reactions/" + senderId, (Object) reactionPayload);
    }
}
