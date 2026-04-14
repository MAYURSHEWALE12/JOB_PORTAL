package com.jobportal.controller;

import com.jobportal.dto.UserDTO;
import com.jobportal.entity.Message;
import com.jobportal.entity.MessageReaction;
import com.jobportal.entity.User;
import com.jobportal.entity.UserRole;
import com.jobportal.repository.JobApplicationRepository;
import com.jobportal.exception.CustomException;
import com.jobportal.exception.ResourceNotFoundException;
import com.jobportal.repository.MessageReactionRepository;
import com.jobportal.repository.MessageRepository;
import com.jobportal.repository.UserRepository;
import com.jobportal.security.SecurityUtil;
import com.jobportal.service.NotificationService;
import jakarta.servlet.http.HttpServletRequest;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.Set;

@RestController
@RequestMapping("/messages")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Messages", description = "Real-time messaging with file support and reactions")
public class MessageController {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final JobApplicationRepository applicationRepository;
    private final NotificationService notificationService;
    private final SimpMessagingTemplate messagingTemplate;
    private final MessageReactionRepository reactionRepository;
    private final SecurityUtil securityUtil;

    @Value("${file.upload-dir:#{systemProperties['user.dir']}/uploads/messages}")
    private String uploadDir;

    private static final Set<String> ALLOWED_FILE_EXTENSIONS = Set.of(
            ".pdf", ".doc", ".docx", ".txt", ".png", ".jpg", ".jpeg", ".gif", ".zip", ".rar"
    );

    /**
     * POST /api/messages/send
     */
    @PostMapping("/send")
    public ResponseEntity<Message> sendMessage(
            @RequestParam Long receiverId,
            @RequestBody Map<String, String> body,
            HttpServletRequest request) {

        Long senderId = securityUtil.getCurrentUserId(request);
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

        // Security Check: Messaging Restrictions
        if (!isMessagingAllowed(sender, receiver)) {
            throw new CustomException("You are not allowed to message this user. Connection (e.g., job application) or Admin role required.", HttpStatus.FORBIDDEN);
        }

        String messageType = body.getOrDefault("messageType", "TEXT");
        String fileUrl = body.get("fileUrl");
        String fileName = body.get("fileName");

        Message message = Message.builder()
                .sender(sender)
                .receiver(receiver)
                .content(content.trim())
                .messageType(messageType)
                .fileUrl(fileUrl)
                .fileName(fileName)
                .build();

        Message saved = messageRepository.save(message);
        log.info("Message sent from {} to {}", senderId, receiverId);

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
     * GET /api/messages/conversation?partnerId=2
     */
    @GetMapping("/conversation")
    public ResponseEntity<List<Message>> getConversation(
            @RequestParam Long partnerId,
            HttpServletRequest request) {

        Long userId = securityUtil.getCurrentUserId(request);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        User partner = userRepository.findById(partnerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", partnerId));

        messageRepository.markAsRead(partner, user);

        return ResponseEntity.ok(messageRepository.findConversation(user, partner));
    }

    /**
     * GET /api/messages/inbox
     */
    @GetMapping("/inbox")
    public ResponseEntity<List<Map<String, Object>>> getInbox(HttpServletRequest request) {
        Long userId = securityUtil.getCurrentUserId(request);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        List<User> partners = messageRepository.findConversationPartners(user);
        if (partners.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }

        List<Message> latestMessages = messageRepository.findLatestMessagesPerPartner(user);
        long unread = messageRepository.countByReceiverAndIsReadFalse(user);

        Map<Long, Message> latestByPartner = new java.util.HashMap<>();
        for (Message msg : latestMessages) {
            Long partnerId = msg.getSender().getId().equals(userId)
                    ? msg.getReceiver().getId()
                    : msg.getSender().getId();
            latestByPartner.put(partnerId, msg);
        }

        List<Map<String, Object>> inbox = new ArrayList<>();
        for (User partner : partners) {
            Message latest = latestByPartner.get(partner.getId());
            if (latest != null) {
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
     * GET /api/messages/unread-count
     */
    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount(HttpServletRequest request) {
        Long userId = securityUtil.getCurrentUserId(request);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        long count = messageRepository.countByReceiverAndIsReadFalse(user);
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    /**
     * GET /api/messages/users
     */
    @GetMapping("/users")
    public ResponseEntity<List<UserDTO>> getUsersToMessage(HttpServletRequest request) {
        Long userId = securityUtil.getCurrentUserId(request);
        User currentUser = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        List<UserDTO> allowedUsers = userRepository.findAll().stream()
                .filter(u -> !u.getId().equals(userId))
                .filter(u -> isMessagingAllowed(currentUser, u))
                .map(UserDTO::fromEntity)
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(allowedUsers);
    }

    /**
     * POST /api/messages/upload
     */
    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam Long receiverId,
            HttpServletRequest request) {

        Long senderId = securityUtil.getCurrentUserId(request);

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "File cannot be empty"));
        }

        if (file.getSize() > 25 * 1024 * 1024) {
            return ResponseEntity.badRequest().body(Map.of("error", "File size must be under 25MB"));
        }

        String originalName = file.getOriginalFilename();
        String extension = originalName != null && originalName.contains(".")
                ? originalName.substring(originalName.lastIndexOf(".")).toLowerCase()
                : "";

        if (!ALLOWED_FILE_EXTENSIONS.contains(extension)) {
            return ResponseEntity.badRequest().body(Map.of("error", "File type not allowed"));
        }

        String contentType = file.getContentType();
        if (contentType == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "File content type could not be determined"));
        }

        boolean validContentType = contentType.equals("application/pdf")
                || contentType.equals("application/msword")
                || contentType.equals("application/vnd.openxmlformats-officedocument.wordprocessingml.document")
                || contentType.equals("text/plain")
                || contentType.startsWith("image/");
        if (!validContentType) {
            return ResponseEntity.badRequest().body(Map.of("error", "File content type not allowed"));
        }

        try {
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String fileName = UUID.randomUUID().toString() + extension;
            Path filePath = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), filePath);

            String fileUrl = "/api/messages/files/" + fileName;

            return ResponseEntity.ok(Map.of(
                    "fileUrl", fileUrl,
                    "fileName", originalName,
                    "fileSize", file.getSize()
            ));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to upload file"));
        }
    }

    /**
     * PUT /api/messages/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> editMessage(@PathVariable Long id, @RequestBody Map<String, String> body, HttpServletRequest request) {
        Message message = messageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Message", "id", id));

        Long currentUserId = securityUtil.getCurrentUserId(request);
        if (!message.getSender().getId().equals(currentUserId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "You can only edit your own messages"));
        }

        String newContent = body.get("content");
        if (newContent == null || newContent.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Message content cannot be empty"));
        }

        message.setContent(newContent.trim());
        message.setEdited(true);
        message.setEditedAt(java.time.LocalDateTime.now());
        Message saved = messageRepository.save(message);

        messagingTemplate.convertAndSend("/topic/messages/" + message.getReceiver().getId(), saved);
        messagingTemplate.convertAndSend("/topic/messages/" + message.getSender().getId(), saved);

        return ResponseEntity.ok(saved);
    }

    /**
     * DELETE /api/messages/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMessage(@PathVariable Long id, HttpServletRequest request) {
        Long userId = securityUtil.getCurrentUserId(request);
        Message message = messageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Message", "id", id));

        if (!message.getSender().getId().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "You can only delete your own messages"));
        }

        messageRepository.delete(message);

        messagingTemplate.convertAndSend("/topic/messages/" + message.getReceiver().getId(), (Object) Map.of("id", id, "deleted", true));
        messagingTemplate.convertAndSend("/topic/messages/" + message.getSender().getId(), (Object) Map.of("id", id, "deleted", true));

        return ResponseEntity.ok(Map.of("message", "Message deleted"));
    }

    /**
     * POST /api/messages/reactions
     */
    @PostMapping("/reactions")
    @Transactional
    public ResponseEntity<?> toggleReaction(
            @RequestBody Map<String, Object> body,
            HttpServletRequest request) {
        Long currentUserId = securityUtil.getCurrentUserId(request);
        Long messageId = Long.valueOf(body.get("messageId").toString());
        String emoji = body.get("emoji").toString();
        boolean add = Boolean.parseBoolean(body.get("add").toString());

        Optional<Message> msgOpt = messageRepository.findById(messageId);
        if (msgOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Message not found"));
        }
        Message message = msgOpt.get();

        Optional<User> userOpt = userRepository.findById(currentUserId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
        }
        User user = userOpt.get();

        if (add) {
            reactionRepository.findByMessageIdAndUserIdAndEmoji(messageId, currentUserId, emoji)
                .orElseGet(() -> reactionRepository.save(MessageReaction.builder()
                    .message(message)
                    .user(user)
                    .emoji(emoji)
                    .build()));
        } else {
            reactionRepository.deleteByMessageIdAndUserIdAndEmoji(messageId, currentUserId, emoji);
        }

        var reactions = reactionRepository.findByMessageId(messageId);
        List<Map<String, Object>> reactionList = new ArrayList<>();
        for (MessageReaction r : reactions) {
            reactionList.add(Map.of(
                "emoji", r.getEmoji(),
                "userId", r.getUser().getId(),
                "userName", r.getUser().getFirstName() + " " + r.getUser().getLastName()
            ));
        }

        Long receiverId = message.getReceiver().getId();
        Long senderId = message.getSender().getId();
        var payload = Map.of("messageId", messageId, "reactions", reactionList);
        messagingTemplate.convertAndSend("/topic/reactions/" + receiverId, (Object) payload);
        messagingTemplate.convertAndSend("/topic/reactions/" + senderId, (Object) payload);

        return ResponseEntity.ok(payload);
    }

    /**
     * GET /api/messages/reactions/{messageId}
     */
    @GetMapping("/reactions/{messageId}")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getReactions(@PathVariable Long messageId) {
        List<MessageReaction> reactions = reactionRepository.findByMessageId(messageId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (MessageReaction r : reactions) {
            result.add(Map.of(
                "emoji", r.getEmoji(),
                "userId", r.getUser().getId(),
                "userName", r.getUser().getFirstName() + " " + r.getUser().getLastName()
            ));
        }
        return ResponseEntity.ok(Map.of("messageId", messageId, "reactions", result));
    }

    /**
     * GET /api/messages/reactions/batch?messageIds=1,2,3
     */
    @GetMapping("/reactions/batch")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getReactionsBatch(@RequestParam String messageIds) {
        List<Long> ids = java.util.Arrays.stream(messageIds.split(","))
                .map(Long::parseLong)
                .collect(java.util.stream.Collectors.toList());

        Map<Long, List<Map<String, Object>>> result = new java.util.HashMap<>();
        for (Long id : ids) {
            List<MessageReaction> reactions = reactionRepository.findByMessageId(id);
            List<Map<String, Object>> reactionList = new ArrayList<>();
            for (MessageReaction r : reactions) {
                reactionList.add(Map.of(
                    "emoji", r.getEmoji(),
                    "userId", r.getUser().getId(),
                    "userName", r.getUser().getFirstName() + " " + r.getUser().getLastName()
                ));
            }
            if (!reactionList.isEmpty()) {
                result.put(id, reactionList);
            }
        }
        return ResponseEntity.ok(result);
    }

    /**
     * GET /api/messages/files/{fileName}
     */
    @GetMapping("/files/{fileName}")
    public ResponseEntity<org.springframework.core.io.Resource> getFile(@PathVariable String fileName) {
        try {
            Path filePath = Paths.get(uploadDir).resolve(fileName).normalize();
            if (!filePath.startsWith(Paths.get(uploadDir).normalize())) {
                return ResponseEntity.badRequest().build();
            }
            org.springframework.core.io.Resource resource = new org.springframework.core.io.UrlResource(filePath.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }
            String contentType = "application/octet-stream";
            if (fileName.endsWith(".pdf")) contentType = "application/pdf";
            else if (fileName.endsWith(".png")) contentType = "image/png";
            else if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) contentType = "image/jpeg";
            else if (fileName.endsWith(".gif")) contentType = "image/gif";
            else if (fileName.endsWith(".txt")) contentType = "text/plain";
            return ResponseEntity.ok()
                    .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
                    .contentType(org.springframework.http.MediaType.parseMediaType(contentType))
                    .body(resource);
        } catch (java.net.MalformedURLException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Helper to check if messaging is allowed between two users
     */
    private boolean isMessagingAllowed(User sender, User receiver) {
        log.debug("Checking messaging permission: sender={}, receiver={}", sender.getEmail(), receiver.getEmail());
        
        // Admin can message anyone, anyone can message admin
        if (sender.getRole() == UserRole.ADMIN || receiver.getRole() == UserRole.ADMIN) {
             log.debug("Permission GRANTED: One of the users is ADMIN");
             return true;
        }

        // Allow if they already have an existing conversation
        List<User> partners = messageRepository.findConversationPartners(sender);
        if (partners.contains(receiver)) {
             log.debug("Permission GRANTED: Existing conversation found");
             return true;
        }

        // Allow if there is a job application relationship
        boolean hasRelation = applicationRepository.existsRelationship(sender, receiver);
        log.debug("Relationship check: {}", hasRelation);
        return hasRelation;
    }
}
