package com.jobportal.controller;

import com.jobportal.dto.UserDTO;
import com.jobportal.entity.User;
import com.jobportal.entity.UserRole;
import com.jobportal.entity.Job;
import com.jobportal.entity.JobApplication;
import com.jobportal.entity.QuizResult;
import com.jobportal.entity.ResumeAnalysis;
import com.jobportal.entity.Quiz;
import com.jobportal.repository.JobApplicationRepository;
import com.jobportal.repository.JobRepository;
import com.jobportal.repository.UserRepository;
import com.jobportal.repository.SavedJobRepository;
import com.jobportal.repository.QuizResultRepository;
import com.jobportal.repository.ResumeAnalysisRepository;
import com.jobportal.repository.QuizRepository;
import com.jobportal.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "http://localhost:5173")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository userRepository;
    private final JobRepository jobRepository;
    private final JobApplicationRepository applicationRepository;
    private final SavedJobRepository savedJobRepository;
    private final QuizResultRepository quizResultRepository;
    private final ResumeAnalysisRepository resumeAnalysisRepository;
    private final QuizRepository quizRepository;
    private final UserService userService;

    /**
     * GET /api/admin/stats
     * Overall platform statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers",        userRepository.count());
        stats.put("totalJobs",         jobRepository.count());
        stats.put("totalApplications", applicationRepository.count());
        stats.put("totalJobSeekers",   userRepository.findByRole(UserRole.JOBSEEKER).size());
        stats.put("totalEmployers",    userRepository.findByRole(UserRole.EMPLOYER).size());
        stats.put("activeJobs",        jobRepository.findByStatus(com.jobportal.entity.JobStatus.ACTIVE).size());
        return ResponseEntity.ok(stats);
    }

    /**
     * GET /api/admin/users
     * Get all users
     */
    @GetMapping("/users")
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        List<UserDTO> users = userRepository.findAll().stream()
                .map(UserDTO::fromEntity)
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(users);
    }

    /**
     * DELETE /api/admin/users/{id}
     * Delete any user
     */
    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
    }

    /**
     * PUT /api/admin/users/{id}/role?role=EMPLOYER
     * Change user role
     */
    @PutMapping("/users/{id}/role")
    public ResponseEntity<UserDTO> updateUserRole(
            @PathVariable Long id,
            @RequestParam UserRole role) {
        return ResponseEntity.ok(UserDTO.fromEntity(userService.updateUserRole(id, role)));
    }

    /**
     * GET /api/admin/jobs
     * Get all jobs (all statuses)
     */
    @GetMapping("/jobs")
    public ResponseEntity<List<Job>> getAllJobs() {
        return ResponseEntity.ok(jobRepository.findAll());
    }

    /**
     * DELETE /api/admin/jobs/{id}
     * Delete any job
     */
    @DeleteMapping("/jobs/{id}")
    @Transactional
    public ResponseEntity<?> deleteJob(@PathVariable Long id) {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new com.jobportal.exception.ResourceNotFoundException("Job", "id", id));
        // Delete related records first to avoid FK constraint violations
        quizRepository.findByJob(job).ifPresent(quizRepository::delete);
        List<JobApplication> applications = applicationRepository.findByJob(job);
        for (JobApplication app : applications) {
            quizResultRepository.findByApplication(app).ifPresent(quizResultRepository::delete);
        }
        resumeAnalysisRepository.deleteAll(resumeAnalysisRepository.findByJob(job));
        applicationRepository.deleteAll(applications);
        savedJobRepository.deleteAll(savedJobRepository.findByJob(job));
        jobRepository.delete(job);
        return ResponseEntity.ok(Map.of("message", "Job deleted successfully"));
    }

    /**
     * GET /api/admin/applications
     * Get all applications
     */
    @GetMapping("/applications")
    public ResponseEntity<List<JobApplication>> getAllApplications() {
        return ResponseEntity.ok(applicationRepository.findAll());
    }
}
