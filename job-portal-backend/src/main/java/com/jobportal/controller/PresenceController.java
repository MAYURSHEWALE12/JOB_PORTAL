package com.jobportal.controller;

import com.jobportal.service.PresenceService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/presence")
@RequiredArgsConstructor
@Tag(name = "Presence", description = "Endpoints for tracking user online status")
@Slf4j
public class PresenceController {

    private final PresenceService presenceService;

    @GetMapping("/online-users")
    public ResponseEntity<List<Long>> getOnlineUsers() {
        try {
            Set<Long> onlineUsers = presenceService.getOnlineUsers();
            log.info("Fetching online users: {}", onlineUsers);
            return ResponseEntity.ok(new ArrayList<>(onlineUsers));
        } catch (Exception e) {
            log.error("Error fetching online users", e);
            return ResponseEntity.status(500).build();
        }
    }
}
