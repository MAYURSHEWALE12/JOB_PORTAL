package com.jobportal.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class PresenceService {

    private final SimpMessagingTemplate messagingTemplate;
    
    // sessionID -> userId
    private final Map<String, Long> sessionUserMap = new ConcurrentHashMap<>();
    
    // userId -> count of active sessions
    private final Map<Long, Integer> userSessionCountMap = new ConcurrentHashMap<>();

    public void userConnected(String sessionId, Long userId) {
        sessionUserMap.put(sessionId, userId);
        
        userSessionCountMap.compute(userId, (id, count) -> {
            int newCount = (count == null) ? 1 : count + 1;
            if (newCount == 1) {
                broadcastStatus(userId, true);
            }
            return newCount;
        });
        
        log.info("User {} connected (session: {})", userId, sessionId);
    }

    public void userDisconnected(String sessionId) {
        Long userId = sessionUserMap.remove(sessionId);
        if (userId != null) {
            userSessionCountMap.compute(userId, (id, count) -> {
                if (count == null || count <= 1) {
                    broadcastStatus(userId, false);
                    return null;
                }
                return count - 1;
            });
            log.info("User {} disconnected (session: {})", userId, sessionId);
        }
    }

    public boolean isUserOnline(Long userId) {
        return userSessionCountMap.containsKey(userId);
    }

    public Set<Long> getOnlineUsers() {
        return userSessionCountMap.keySet();
    }

    private void broadcastStatus(Long userId, boolean isOnline) {
        messagingTemplate.convertAndSend("/topic/online-status", (Object) Map.of(
                "userId", userId,
                "status", isOnline ? "ONLINE" : "OFFLINE"
        ));
    }
}
