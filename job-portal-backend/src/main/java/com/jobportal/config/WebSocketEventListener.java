package com.jobportal.config;

import com.jobportal.service.PresenceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketEventListener {

    private final PresenceService presenceService;

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        
        // Extract userId from connect headers
        List<String> userIdHeaders = headerAccessor.getNativeHeader("userId");
        if (userIdHeaders != null && !userIdHeaders.isEmpty()) {
            try {
                Long userId = Long.parseLong(userIdHeaders.get(0));
                String sessionId = headerAccessor.getSessionId();
                presenceService.userConnected(sessionId, userId);
            } catch (NumberFormatException e) {
                log.warn("Invalid userId in WebSocket connect header: {}", userIdHeaders.get(0));
            }
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        presenceService.userDisconnected(sessionId);
    }
}
