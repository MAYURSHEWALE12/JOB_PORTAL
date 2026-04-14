package com.jobportal.controller;

import com.jobportal.dto.PageResponse;
import com.jobportal.entity.ApplicationStatus;
import com.jobportal.entity.JobApplication;
import com.jobportal.entity.UserRole;
import com.jobportal.exception.CustomException;
import com.jobportal.repository.JobRepository;
import com.jobportal.security.SecurityUtil;
import com.jobportal.service.JobApplicationService;
import jakarta.servlet.http.HttpServletRequest;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/applications")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Applications", description = "Job application submission and management")
public class JobApplicationController {

    private final JobApplicationService applicationService;
    private final SecurityUtil securityUtil;
    private final JobRepository jobRepository;

    /**
     * POST /api/applications/apply
     */
    @PostMapping("/apply")
    public ResponseEntity<JobApplication> applyForJob(
            @RequestParam Long jobId,
            @RequestParam(required = false) Long resumeId,
            @RequestBody(required = false) Map<String, String> body,
            HttpServletRequest request) {

        Long jobSeekerId = securityUtil.getCurrentUserId(request);
        String coverLetter = body != null ? body.get("coverLetter") : "";
        JobApplication application = applicationService.applyForJob(
                jobId, jobSeekerId, coverLetter, resumeId);
        return ResponseEntity.status(HttpStatus.CREATED).body(application);
    }

    /**
     * GET /api/applications/my-applications?page=0&size=10
     */
    @GetMapping("/my-applications")
    public ResponseEntity<PageResponse<JobApplication>> getMyApplications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            HttpServletRequest request) {
        Long jobSeekerId = securityUtil.getCurrentUserId(request);
        return ResponseEntity.ok(applicationService.getMyApplicationsPaginated(jobSeekerId, page, size));
    }

    /**
     * GET /api/applications/job/{jobId}?page=0&size=10
     */
    @GetMapping("/job/{jobId}")
    public ResponseEntity<PageResponse<JobApplication>> getApplicationsForJob(
            @PathVariable Long jobId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            HttpServletRequest request) {

        Long currentUserId = securityUtil.getCurrentUserId(request);
        UserRole currentRole = securityUtil.getCurrentUserRole(request);

        var job = jobRepository.findById(jobId)
                .orElseThrow(() -> new CustomException("Job not found", HttpStatus.NOT_FOUND));

        if (!currentRole.equals(UserRole.ADMIN) && !job.getEmployer().getId().equals(currentUserId)) {
            throw new CustomException("Access denied", HttpStatus.FORBIDDEN);
        }

        return ResponseEntity.ok(applicationService.getApplicationsForJobPaginated(jobId, currentUserId, page, size));
    }

    /**
     * GET /api/applications/employer?page=0&size=10
     */
    @GetMapping("/employer")
    public ResponseEntity<PageResponse<JobApplication>> getEmployerApplications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            HttpServletRequest request) {
        Long employerId = securityUtil.getCurrentUserId(request);
        return ResponseEntity.ok(applicationService.getApplicationsByEmployerPaginated(employerId, page, size));
    }

    /**
     * PUT /api/applications/{id}/withdraw
     */
    @PutMapping("/{id}/withdraw")
    public ResponseEntity<?> withdrawApplication(
            @PathVariable Long id,
            HttpServletRequest request) {
        Long jobSeekerId = securityUtil.getCurrentUserId(request);
        applicationService.withdrawApplication(id, jobSeekerId);
        return ResponseEntity.ok(Map.of("message", "Application withdrawn successfully"));
    }

    /**
     * PUT /api/applications/{id}/status?status=SHORTLISTED&rating=5&feedback=Great!
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<JobApplication> updateStatus(
            @PathVariable Long id,
            @RequestParam ApplicationStatus status,
            @RequestParam(required = false) Integer rating,
            @RequestParam(required = false) String feedback,
            HttpServletRequest request) {
        Long employerId = securityUtil.getCurrentUserId(request);
        return ResponseEntity.ok(
                applicationService.updateApplicationStatus(id, employerId, status, rating, feedback));
    }

    /**
     * GET /api/applications/check?jobId=1
     */
    @GetMapping("/check")
    public ResponseEntity<?> checkApplied(
            @RequestParam Long jobId,
            HttpServletRequest request) {
        Long jobSeekerId = securityUtil.getCurrentUserId(request);
        boolean applied = applicationService.hasApplied(jobId, jobSeekerId);
        return ResponseEntity.ok(Map.of("applied", applied));
    }

    /**
     * POST /api/applications/{id}/send-offer?salary=50000&startDate=2026-05-01&subject=Offer&offerContent=...
     */
    @PostMapping("/{id}/send-offer")
    public ResponseEntity<JobApplication> sendOffer(
            @PathVariable Long id,
            @RequestParam(required = false) Double salary,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String subject,
            @RequestParam(required = false) String offerContent,
            HttpServletRequest request) {
        Long employerId = securityUtil.getCurrentUserId(request);
        return ResponseEntity.ok(
                applicationService.sendOfferLetter(id, employerId, offerContent, subject, salary, startDate));
    }

    /**
     * PUT /api/applications/{id}/accept
     */
    @PutMapping("/{id}/accept")
    public ResponseEntity<JobApplication> acceptOffer(
            @PathVariable Long id,
            HttpServletRequest request) {
        Long jobSeekerId = securityUtil.getCurrentUserId(request);
        return ResponseEntity.ok(applicationService.acceptOffer(id, jobSeekerId));
    }

    /**
     * PUT /api/applications/{id}/reject-offer
     */
    @PutMapping("/{id}/reject-offer")
    public ResponseEntity<JobApplication> rejectOffer(
            @PathVariable Long id,
            HttpServletRequest request) {
        Long jobSeekerId = securityUtil.getCurrentUserId(request);
        return ResponseEntity.ok(applicationService.rejectOffer(id, jobSeekerId));
    }

    /**
     * GET /api/applications/{id}/offer-letter
     */
    @GetMapping("/{id}/offer-letter")
    public ResponseEntity<?> getOfferLetter(
            @PathVariable Long id,
            HttpServletRequest request) {
        Long currentUserId = securityUtil.getCurrentUserId(request);
        UserRole currentRole = securityUtil.getCurrentUserRole(request);

        JobApplication application = applicationService.getApplicationById(id);

        boolean isJobSeeker = application.getJobSeeker().getId().equals(currentUserId);
        boolean isEmployer = application.getJob().getEmployer().getId().equals(currentUserId);
        boolean isAdmin = currentRole == UserRole.ADMIN;

        if (!isJobSeeker && !isEmployer && !isAdmin) {
            throw new CustomException("Access denied", HttpStatus.FORBIDDEN);
        }

        if (application.getOfferLetterContent() == null) {
            throw new CustomException("No offer letter found", HttpStatus.NOT_FOUND);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("offerLetter", application.getOfferLetterContent());
        response.put("sentAt", application.getOfferSentAt());
        response.put("acceptedAt", application.getOfferAcceptedAt());
        response.put("status", application.getStatus().name());
        response.put("jobTitle", application.getJob().getTitle());
        response.put("companyName", application.getJob().getEmployer().getFirstName() + " " + application.getJob().getEmployer().getLastName());
        response.put("candidateName", application.getJobSeeker().getFirstName() + " " + application.getJobSeeker().getLastName());
        return ResponseEntity.ok(response);
    }
}
