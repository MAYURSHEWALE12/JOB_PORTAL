package com.jobportal.controller;

import com.jobportal.service.PresenceService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Set;

@RestController
@RequestMapping("/api/presence")
@RequiredArgsConstructor
@Tag(name = "Presence", description = "Endpoints for tracking user online status")
public class PresenceController {

    private final PresenceService presenceService;

    @GetMapping("/online-users")
    public ResponseEntity<Set<Long>> getOnlineUsers() {
        return ResponseEntity.ok(presenceService.getOnlineUsers());
    }
}
