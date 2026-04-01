package com.jobportal.service;

import com.jobportal.dto.PageResponse;
import com.jobportal.entity.*;
import com.jobportal.exception.CustomException;
import com.jobportal.exception.ResourceNotFoundException;
import com.jobportal.repository.JobApplicationRepository;
import com.jobportal.repository.JobRepository;
import com.jobportal.repository.ResumeRepository;
import com.jobportal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class JobApplicationService {

    private final JobApplicationRepository applicationRepository;
    private final JobRepository            jobRepository;
    private final UserRepository           userRepository;
    private final ResumeRepository         resumeRepository;
    private final NotificationService      notificationService;

    /**
     * Apply for a job
     */
    public JobApplication applyForJob(Long jobId, Long jobSeekerId,
                                      String coverLetter, Long resumeId) {

        // Get job
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job", "id", jobId));

        // Get jobseeker
        User jobSeeker = userRepository.findById(jobSeekerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", jobSeekerId));

        // Only jobseekers can apply
        if (jobSeeker.getRole() != UserRole.JOBSEEKER) {
            throw new CustomException("Only job seekers can apply for jobs", HttpStatus.FORBIDDEN);
        }

        // Job must be active
        if (job.getStatus() != JobStatus.ACTIVE) {
            throw new CustomException("This job is no longer accepting applications", HttpStatus.BAD_REQUEST);
        }

        // Check if already applied
        if (applicationRepository.existsByJobAndJobSeeker(job, jobSeeker)) {
            throw new CustomException("You have already applied for this job", HttpStatus.CONFLICT);
        }

        // Get selected resume if provided
        Resume selectedResume = null;
        if (resumeId != null) {
            selectedResume = resumeRepository.findById(resumeId).orElse(null);
        }

        // Create application
        JobApplication application = JobApplication.builder()
                .job(job)
                .jobSeeker(jobSeeker)
                .coverLetter(coverLetter)
                .selectedResume(selectedResume)       // ✅ added
                .status(ApplicationStatus.PENDING)
                .build();

        JobApplication saved = applicationRepository.save(application);
        log.info("User {} applied for job {} with resume {}",
                jobSeeker.getEmail(), job.getTitle(),
                selectedResume != null ? selectedResume.getName() : "none");

        jobRepository.incrementApplicationCount(jobId);

        // Notify employer
        String message = String.format("%s %s just applied for your job posting: %s", 
                jobSeeker.getFirstName(), jobSeeker.getLastName(), job.getTitle());
        notificationService.sendNotification(job.getEmployer().getId(), "New Application", message, "INFO", job.getId(), "JOB");
        
        return saved;
    }

    /**
     * Get all applications by a jobseeker
     */
    @Transactional(readOnly = true)
    public List<JobApplication> getMyApplications(Long jobSeekerId) {
        User jobSeeker = userRepository.findById(jobSeekerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", jobSeekerId));
        return applicationRepository.findByJobSeeker(jobSeeker);
    }

    @Transactional(readOnly = true)
    public PageResponse<JobApplication> getMyApplicationsPaginated(Long jobSeekerId, int page, int size) {
        User jobSeeker = userRepository.findById(jobSeekerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", jobSeekerId));
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "appliedAt"));
        Page<JobApplication> appPage = applicationRepository.findByJobSeeker(jobSeeker, pageable);
        return toPageResponse(appPage);
    }

    /**
     * Get all applications for a job (employer view)
     */
    @Transactional(readOnly = true)
    public List<JobApplication> getApplicationsForJob(Long jobId, Long employerId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job", "id", jobId));

        if (!job.getEmployer().getId().equals(employerId)) {
            throw new CustomException(
                    "You can only view applications for your own jobs", HttpStatus.FORBIDDEN);
        }

        return applicationRepository.findByJob(job);
    }

    @Transactional(readOnly = true)
    public PageResponse<JobApplication> getApplicationsForJobPaginated(Long jobId, Long employerId, int page, int size) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job", "id", jobId));

        if (!job.getEmployer().getId().equals(employerId)) {
            throw new CustomException(
                    "You can only view applications for your own jobs", HttpStatus.FORBIDDEN);
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "appliedAt"));
        Page<JobApplication> appPage = applicationRepository.findByJob(job, pageable);
        return toPageResponse(appPage);
    }

    /**
     * Get ALL applications for an employer (all jobs)
     */
    @Transactional(readOnly = true)
    public List<JobApplication> getApplicationsByEmployer(Long employerId) {
        User employer = userRepository.findById(employerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", employerId));
        return applicationRepository.findByJobEmployer(employer);
    }

    @Transactional(readOnly = true)
    public PageResponse<JobApplication> getApplicationsByEmployerPaginated(Long employerId, int page, int size) {
        User employer = userRepository.findById(employerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", employerId));
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "appliedAt"));
        Page<JobApplication> appPage = applicationRepository.findByJobEmployer(employer, pageable);
        return toPageResponse(appPage);
    }

    /**
     * Withdraw application (jobseeker)
     */
    public void withdrawApplication(Long applicationId, Long jobSeekerId) {
        JobApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Application", "id", applicationId));

        if (!application.getJobSeeker().getId().equals(jobSeekerId)) {
            throw new CustomException(
                    "You can only withdraw your own applications", HttpStatus.FORBIDDEN);
        }

        if (application.getStatus() != ApplicationStatus.PENDING) {
            throw new CustomException(
                    "Only pending applications can be withdrawn", HttpStatus.BAD_REQUEST);
        }

        application.setStatus(ApplicationStatus.WITHDRAWN);
        applicationRepository.save(application);
        log.info("Application {} withdrawn", applicationId);
    }

    /**
     * Update application status and details (employer)
     */
    public JobApplication updateApplicationStatus(Long applicationId,
                                                  Long employerId,
                                                  ApplicationStatus newStatus,
                                                  Integer rating,
                                                  String feedback) {
        JobApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Application", "id", applicationId));

        if (!application.getJob().getEmployer().getId().equals(employerId)) {
            throw new CustomException(
                    "You can only update applications for your own jobs", HttpStatus.FORBIDDEN);
        }

        application.setStatus(newStatus);
        if (rating != null) application.setRating(rating);
        if (feedback != null) application.setFeedback(feedback);
        
        JobApplication updated = applicationRepository.save(application);

        // Notify jobseeker
        String message = String.format("Your application for '%s' has been updated to: %s", 
                application.getJob().getTitle(), newStatus.name());
        notificationService.sendNotification(application.getJobSeeker().getId(), "Application Update", message, "INFO", application.getId(), "APPLICATION");

        return updated;
    }

    /**
     * Check if jobseeker already applied for a job
     */
    @Transactional(readOnly = true)
    public boolean hasApplied(Long jobId, Long jobSeekerId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job", "id", jobId));
        User jobSeeker = userRepository.findById(jobSeekerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", jobSeekerId));
        return applicationRepository.existsByJobAndJobSeeker(job, jobSeeker);
    }

    private PageResponse<JobApplication> toPageResponse(Page<JobApplication> page) {
        return PageResponse.<JobApplication>builder()
                .content(page.getContent())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
    }
}