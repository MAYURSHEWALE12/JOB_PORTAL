package com.jobportal.controller;

import com.jobportal.entity.JobAlertPreference;
import com.jobportal.service.JobAlertService;
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
public class JobAlertController {

    private final JobAlertService jobAlertService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<JobAlertPreference>> getUserAlerts(@PathVariable Long userId) {
        return ResponseEntity.ok(jobAlertService.getUserAlerts(userId));
    }

    @PostMapping("/user/{userId}")
    public ResponseEntity<JobAlertPreference> createAlert(
            @PathVariable Long userId,
            @RequestBody JobAlertPreference preference) {
        return ResponseEntity.ok(jobAlertService.createAlert(userId, preference));
    }

    @PutMapping("/{alertId}")
    public ResponseEntity<JobAlertPreference> updateAlert(
            @PathVariable Long alertId,
            @RequestBody JobAlertPreference preference) {
        return ResponseEntity.ok(jobAlertService.updateAlert(alertId, preference));
    }

    @DeleteMapping("/{alertId}")
    public ResponseEntity<Map<String, String>> deleteAlert(
            @PathVariable Long alertId,
            @RequestParam Long userId) {
        jobAlertService.deleteAlert(alertId, userId);
        return ResponseEntity.ok(Map.of("message", "Alert deleted successfully"));
    }
}
