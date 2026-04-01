package com.jobportal.controller;

import com.jobportal.entity.Job;
import com.jobportal.entity.SavedJob;
import com.jobportal.entity.User;
import com.jobportal.exception.CustomException;
import com.jobportal.exception.ResourceNotFoundException;
import com.jobportal.repository.JobRepository;
import com.jobportal.repository.SavedJobRepository;
import com.jobportal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/saved-jobs")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class SavedJobController {

    private final SavedJobRepository savedJobRepository;
    private final JobRepository jobRepository;
    private final UserRepository userRepository;

    /**
     * POST /api/saved-jobs/save?userId=1&jobId=2
     * Save a job
     */
    @PostMapping("/save")
    public ResponseEntity<?> saveJob(
            @RequestParam Long userId,
            @RequestParam Long jobId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job", "id", jobId));

        if (savedJobRepository.existsByUserAndJob(user, job)) {
            throw new CustomException("Job already saved!", HttpStatus.CONFLICT);
        }

        SavedJob savedJob = SavedJob.builder()
                .user(user)
                .job(job)
                .build();

        savedJobRepository.save(savedJob);
        log.info("User {} saved job {}", userId, jobId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "Job saved successfully!"));
    }

    /**
     * DELETE /api/saved-jobs/unsave?userId=1&jobId=2
     * Remove saved job
     */
    @DeleteMapping("/unsave")
    @Transactional
    public ResponseEntity<?> unsaveJob(
            @RequestParam Long userId,
            @RequestParam Long jobId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job", "id", jobId));

        if (!savedJobRepository.existsByUserAndJob(user, job)) {
            throw new CustomException("Job not saved!", HttpStatus.NOT_FOUND);
        }

        savedJobRepository.deleteByUserAndJob(user, job);
        log.info("User {} unsaved job {}", userId, jobId);
        return ResponseEntity.ok(Map.of("message", "Job removed from saved list!"));
    }

    /**
     * GET /api/saved-jobs?userId=1
     * Get all saved jobs for a user
     */
    @GetMapping
    public ResponseEntity<List<SavedJob>> getSavedJobs(@RequestParam Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        return ResponseEntity.ok(savedJobRepository.findByUser(user));
    }

    /**
     * GET /api/saved-jobs/check?userId=1&jobId=2
     * Check if job is saved
     */
    @GetMapping("/check")
    public ResponseEntity<?> checkSaved(
            @RequestParam Long userId,
            @RequestParam Long jobId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job", "id", jobId));

        boolean saved = savedJobRepository.existsByUserAndJob(user, job);
        return ResponseEntity.ok(Map.of("saved", saved));
    }
}
