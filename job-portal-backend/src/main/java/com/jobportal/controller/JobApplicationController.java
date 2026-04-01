package com.jobportal.controller;

import com.jobportal.dto.PageResponse;
import com.jobportal.entity.ApplicationStatus;
import com.jobportal.entity.JobApplication;
import com.jobportal.service.JobApplicationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/applications")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "http://localhost:5173")
public class JobApplicationController {

    private final JobApplicationService applicationService;

    /**
     * POST /api/applications/apply
     */
    @PostMapping("/apply")
    public ResponseEntity<JobApplication> applyForJob(
            @RequestParam Long jobId,
            @RequestParam Long jobSeekerId,
            @RequestParam(required = false) Long resumeId,
            @RequestBody(required = false) Map<String, String> body) {

        String coverLetter = body != null ? body.get("coverLetter") : "";
        JobApplication application = applicationService.applyForJob(
                jobId, jobSeekerId, coverLetter, resumeId);  // ✅ pass resumeId
        return ResponseEntity.status(HttpStatus.CREATED).body(application);
    }

    /**
     * GET /api/applications/my-applications?jobSeekerId=1&page=0&size=10
     */
    @GetMapping("/my-applications")
    public ResponseEntity<PageResponse<JobApplication>> getMyApplications(
            @RequestParam Long jobSeekerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(applicationService.getMyApplicationsPaginated(jobSeekerId, page, size));
    }

    /**
     * GET /api/applications/job/{jobId}?employerId=2&page=0&size=10
     */
    @GetMapping("/job/{jobId}")
    public ResponseEntity<PageResponse<JobApplication>> getApplicationsForJob(
            @PathVariable Long jobId,
            @RequestParam Long employerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(applicationService.getApplicationsForJobPaginated(jobId, employerId, page, size));
    }

    /**
     * GET /api/applications/employer/{employerId}?page=0&size=10
     */
    @GetMapping("/employer/{employerId}")
    public ResponseEntity<PageResponse<JobApplication>> getEmployerApplications(
            @PathVariable Long employerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(applicationService.getApplicationsByEmployerPaginated(employerId, page, size));
    }

    /**
     * PUT /api/applications/{id}/withdraw?jobSeekerId=1
     */
    @PutMapping("/{id}/withdraw")
    public ResponseEntity<?> withdrawApplication(
            @PathVariable Long id,
            @RequestParam Long jobSeekerId) {
        applicationService.withdrawApplication(id, jobSeekerId);
        return ResponseEntity.ok(Map.of("message", "Application withdrawn successfully"));
    }

    /**
     * PUT /api/applications/{id}/status?employerId=2&status=SHORTLISTED&rating=5&feedback=Great!
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<JobApplication> updateStatus(
            @PathVariable Long id,
            @RequestParam Long employerId,
            @RequestParam ApplicationStatus status,
            @RequestParam(required = false) Integer rating,
            @RequestParam(required = false) String feedback) {
        return ResponseEntity.ok(
                applicationService.updateApplicationStatus(id, employerId, status, rating, feedback));
    }

    /**
     * GET /api/applications/check?jobId=1&jobSeekerId=1
     */
    @GetMapping("/check")
    public ResponseEntity<?> checkApplied(
            @RequestParam Long jobId,
            @RequestParam Long jobSeekerId) {
        boolean applied = applicationService.hasApplied(jobId, jobSeekerId);
        return ResponseEntity.ok(Map.of("applied", applied));
    }
}
