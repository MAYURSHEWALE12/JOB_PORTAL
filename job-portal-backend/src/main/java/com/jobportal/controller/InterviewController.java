package com.jobportal.controller;

import com.jobportal.dto.InterviewDTO;
import com.jobportal.entity.User;
import com.jobportal.security.SecurityUtil;
import com.jobportal.service.InterviewService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/interviews")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Interviews", description = "Interview scheduling and management")
public class InterviewController {

    private final InterviewService interviewService;
    private final SecurityUtil securityUtil;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @GetMapping("/test-db")
    public ResponseEntity<?> testDb() {
        log.info("REST request to test Aiven DB from Render production environment");
        try {
            java.util.Map<String, Object> report = new java.util.HashMap<>();
            report.put("timestamp", java.time.LocalDateTime.now().toString());
            
            try (java.sql.Connection conn = jdbcTemplate.getDataSource().getConnection()) {
                report.put("connection", "SUCCESS");
                report.put("database", conn.getCatalog());
                
                java.sql.DatabaseMetaData meta = conn.getMetaData();
                
                java.util.List<String> tables = new java.util.ArrayList<>();
                try (java.sql.ResultSet rs = meta.getTables(null, null, "%", new String[]{"TABLE"})) {
                    while (rs.next()) {
                        tables.add(rs.getString("TABLE_NAME"));
                    }
                }
                report.put("tables", tables);
                
                java.util.List<java.util.Map<String, Object>> columns = new java.util.ArrayList<>();
                try (java.sql.ResultSet rs = meta.getColumns(null, null, "interviews", null)) {
                    while (rs.next()) {
                        columns.add(java.util.Map.of(
                            "name", rs.getString("COLUMN_NAME"),
                            "type", rs.getString("TYPE_NAME"),
                            "size", rs.getInt("COLUMN_SIZE"),
                            "nullable", rs.getString("IS_NULLABLE")
                        ));
                    }
                }
                
                if (columns.isEmpty()) {
                    try (java.sql.ResultSet rs = meta.getColumns(null, null, "INTERVIEWS", null)) {
                        while (rs.next()) {
                            columns.add(java.util.Map.of(
                                "name", rs.getString("COLUMN_NAME"),
                                "type", rs.getString("TYPE_NAME"),
                                "size", rs.getInt("COLUMN_SIZE"),
                                "nullable", rs.getString("IS_NULLABLE")
                            ));
                        }
                    }
                }
                
                report.put("interviews_columns", columns);
                
            } catch (Exception ex) {
                report.put("connection", "FAILED");
                report.put("error", ex.getClass().getSimpleName() + ": " + ex.getMessage());
                java.io.StringWriter sw = new java.io.StringWriter();
                ex.printStackTrace(new java.io.PrintWriter(sw));
                report.put("stacktrace", sw.toString());
            }
            
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(e.getMessage());
        }
    }

    @PostMapping("/schedule")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<?> scheduleInterview(HttpServletRequest request,
                                               @RequestParam Long applicationId,
                                               @Valid @RequestBody InterviewDTO dto) {
        Long interviewerId = securityUtil.getCurrentUserId(request);
        InterviewDTO created = interviewService.scheduleInterview(applicationId, interviewerId, dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}/confirm")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<?> confirmInterview(HttpServletRequest request, @PathVariable Long id) {
        return ResponseEntity.ok(interviewService.confirmInterview(id));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelInterview(HttpServletRequest request, @PathVariable Long id) {
        return ResponseEntity.ok(interviewService.cancelInterview(id));
    }

    @PutMapping("/{id}/complete")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<?> completeInterview(HttpServletRequest request,
                                               @PathVariable Long id,
                                               @RequestBody Map<String, Object> body) {
        String feedback = (String) body.get("feedback");
        Integer rating = body.get("rating") != null ? ((Number) body.get("rating")).intValue() : null;
        return ResponseEntity.ok(interviewService.completeInterview(id, feedback, rating));
    }

    @PutMapping("/{id}/reschedule")
    public ResponseEntity<?> rescheduleInterview(HttpServletRequest request,
                                                 @PathVariable Long id,
                                                 @RequestBody Map<String, String> body) {
        LocalDateTime newTime = LocalDateTime.parse(body.get("scheduledAt"));
        return ResponseEntity.ok(interviewService.rescheduleInterview(id, newTime));
    }

    @GetMapping("/candidate")
    public ResponseEntity<?> getCandidateInterviews(HttpServletRequest request) {
        Long candidateId = securityUtil.getCurrentUserId(request);
        return ResponseEntity.ok(interviewService.getCandidateInterviews(candidateId));
    }

    @GetMapping("/interviewer")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<?> getInterviewerInterviews(HttpServletRequest request) {
        Long interviewerId = securityUtil.getCurrentUserId(request);
        return ResponseEntity.ok(interviewService.getInterviewerInterviews(interviewerId));
    }

    @GetMapping("/application/{applicationId}")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<?> getApplicationInterviews(@PathVariable Long applicationId) {
        return ResponseEntity.ok(interviewService.getApplicationInterviews(applicationId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getInterview(@PathVariable Long id) {
        return ResponseEntity.ok(interviewService.getInterviewById(id));
    }
}
