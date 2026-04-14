package com.jobportal.controller;

import com.jobportal.dto.*;
import com.jobportal.entity.Job;
import com.jobportal.security.SecurityUtil;
import com.jobportal.service.JobService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/jobs")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Jobs", description = "Job posting CRUD, search, and analytics")
public class JobController {

    private final JobService jobService;
    private final SecurityUtil securityUtil;

    @GetMapping
    public ResponseEntity<PageResponse<Job>> getAllJobs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(jobService.getAllActiveJobsPaginated(page, size));
    }

    @GetMapping("/all")
    public ResponseEntity<List<Job>> getAllJobsUnpaginated() {
        return ResponseEntity.ok(jobService.getAllActiveJobs());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Job> getJobById(@PathVariable Long id) {
        return ResponseEntity.ok(jobService.getJobByIdWithViewCount(id));
    }

    @GetMapping("/search")
    public ResponseEntity<PageResponse<Job>> searchJobs(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String jobType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(jobService.searchJobsPaginated(keyword, location, jobType, page, size));
    }

    @PostMapping("/advanced-search")
    public ResponseEntity<PageResponse<Job>> advancedSearch(@RequestBody JobSearchRequest request) {
        return ResponseEntity.ok(jobService.advancedSearch(request));
    }

    @PostMapping
    public ResponseEntity<Job> createJob(
            @RequestBody Job job,
            HttpServletRequest request) {
        Long employerId = getAuthenticatedUserId(request);
        Job created = jobService.createJob(job, employerId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/dto")
    public ResponseEntity<Job> createJobFromDTO(
            @Valid @RequestBody JobCreateRequest request,
            HttpServletRequest httpRequest) {
        Long employerId = getAuthenticatedUserId(httpRequest);
        Job created = jobService.createJobFromDTO(request, employerId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Job> updateJob(
            @PathVariable Long id,
            @RequestBody Job job,
            HttpServletRequest request) {
        Long employerId = getAuthenticatedUserId(request);
        return ResponseEntity.ok(jobService.updateJob(id, job, employerId));
    }

    @PutMapping("/{id}/dto")
    public ResponseEntity<Job> updateJobFromDTO(
            @PathVariable Long id,
            @Valid @RequestBody JobUpdateRequest request,
            HttpServletRequest httpRequest) {
        Long employerId = getAuthenticatedUserId(httpRequest);
        return ResponseEntity.ok(jobService.updateJobFromDTO(id, request, employerId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteJob(
            @PathVariable Long id,
            HttpServletRequest request) {
        Long employerId = getAuthenticatedUserId(request);
        jobService.deleteJob(id, employerId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/employer/{employerId}")
    public ResponseEntity<PageResponse<Job>> getJobsByEmployer(
            @PathVariable Long employerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(jobService.getJobsByEmployerPaginated(employerId, page, size));
    }

    @GetMapping("/my-jobs")
    public ResponseEntity<PageResponse<Job>> getMyJobs(
            HttpServletRequest request,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long employerId = getAuthenticatedUserId(request);
        return ResponseEntity.ok(jobService.getJobsByEmployerPaginated(employerId, page, size));
    }

    @PostMapping("/{id}/close")
    public ResponseEntity<Job> closeJob(
            @PathVariable Long id,
            HttpServletRequest request) {
        Long employerId = getAuthenticatedUserId(request);
        return ResponseEntity.ok(jobService.closeJob(id, employerId));
    }

    @PostMapping("/{id}/clone")
    public ResponseEntity<Job> cloneJob(
            @PathVariable Long id,
            HttpServletRequest request) {
        Long employerId = getAuthenticatedUserId(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(jobService.cloneJob(id, employerId));
    }

    @GetMapping("/recommended")
    public ResponseEntity<PageResponse<Job>> getRecommendedJobs(
            HttpServletRequest request,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long userId = getAuthenticatedUserId(request);
        return ResponseEntity.ok(jobService.getRecommendedJobs(userId, page, size));
    }

    @GetMapping("/{id}/analytics")
    public ResponseEntity<JobAnalyticsDTO> getJobAnalytics(
            @PathVariable Long id,
            HttpServletRequest request) {
        Long employerId = getAuthenticatedUserId(request);
        return ResponseEntity.ok(jobService.getJobAnalytics(id, employerId));
    }

    @PostMapping("/expire")
    public ResponseEntity<Map<String, Object>> expireJobs() {
        int expired = jobService.expireJobs();
        return ResponseEntity.ok(Map.of(
                "message", expired + " jobs expired",
                "expiredCount", expired
        ));
    }

    private Long getAuthenticatedUserId(HttpServletRequest request) {
        return securityUtil.getCurrentUserId(request);
    }
}
