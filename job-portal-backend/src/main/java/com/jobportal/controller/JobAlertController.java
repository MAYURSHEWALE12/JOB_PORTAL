package com.jobportal.controller;

import com.jobportal.entity.JobAlertPreference;
import com.jobportal.security.SecurityUtil;
import com.jobportal.service.JobAlertService;
import jakarta.servlet.http.HttpServletRequest;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/job-alerts")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "http://localhost:5173")
@Tag(name = "Job Alerts", description = "Job alert subscriptions")
public class JobAlertController {

    private final JobAlertService jobAlertService;
    private final SecurityUtil securityUtil;

    @GetMapping("/user")
    public ResponseEntity<List<JobAlertPreference>> getUserAlerts(HttpServletRequest request) {
        Long userId = securityUtil.getCurrentUserId(request);
        return ResponseEntity.ok(jobAlertService.getUserAlerts(userId));
    }

    @PostMapping("/user")
    public ResponseEntity<JobAlertPreference> createAlert(
            @RequestBody JobAlertPreference preference,
            HttpServletRequest request) {
        Long userId = securityUtil.getCurrentUserId(request);
        return ResponseEntity.ok(jobAlertService.createAlert(userId, preference));
    }

    @PutMapping("/{alertId}")
    public ResponseEntity<JobAlertPreference> updateAlert(
            @PathVariable Long alertId,
            @RequestBody JobAlertPreference preference,
            HttpServletRequest request) {
        Long userId = securityUtil.getCurrentUserId(request);
        return ResponseEntity.ok(jobAlertService.updateAlertForUser(alertId, preference, userId));
    }

    @DeleteMapping("/{alertId}")
    public ResponseEntity<Map<String, String>> deleteAlert(
            @PathVariable Long alertId,
            HttpServletRequest request) {
        Long userId = securityUtil.getCurrentUserId(request);
        jobAlertService.deleteAlert(alertId, userId);
        return ResponseEntity.ok(Map.of("message", "Alert deleted successfully"));
    }
}
