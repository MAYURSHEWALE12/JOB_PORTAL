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

import java.time.LocalDateTime;
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
    private final EmailService             emailService;

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

        // Check if already applied (ignoring withdrawn ones)
        if (applicationRepository.existsByJobAndJobSeekerAndStatusNot(job, jobSeeker, ApplicationStatus.WITHDRAWN)) {
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
        application.setStatusUpdatedAt(java.time.LocalDateTime.now());
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
     * Get application by ID
     */
    @Transactional(readOnly = true)
    public JobApplication getApplicationById(Long applicationId) {
        return applicationRepository.findByIdWithDetails(applicationId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Application", "id", applicationId));
    }

    /**
     * Send offer letter to a candidate
     */
    public JobApplication sendOfferLetter(Long applicationId,
                                          Long employerId,
                                          String offerContent,
                                          String subject,
                                          Double salary,
                                          String startDate) {
        JobApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Application", "id", applicationId));

        if (!application.getJob().getEmployer().getId().equals(employerId)) {
            throw new CustomException(
                    "You can only send offers for your own jobs", HttpStatus.FORBIDDEN);
        }

        if (application.getStatus() != ApplicationStatus.SHORTLISTED &&
            application.getStatus() != ApplicationStatus.REVIEWED &&
            application.getStatus() != ApplicationStatus.INTERVIEWING) {
            throw new CustomException(
                    "Can only send offer to candidates in Screening, Shortlisted, or Interviewing stage", HttpStatus.BAD_REQUEST);
        }

        String content = offerContent != null ? offerContent : buildDefaultOfferLetter(application, salary, startDate);
        application.setOfferLetterContent(content);
        application.setOfferSentAt(LocalDateTime.now());
        application.setStatus(ApplicationStatus.OFFERED);
        application.setStatusUpdatedAt(LocalDateTime.now());
        JobApplication updated = applicationRepository.save(application);

        String message = String.format("You have received an offer letter for '%s'!", 
                application.getJob().getTitle());
        notificationService.sendNotification(application.getJobSeeker().getId(), "Job Offer Received", message, "OFFER", application.getId(), "APPLICATION");

        emailService.sendOfferLetterEmail(
                application.getJobSeeker().getEmail(),
                application.getJobSeeker().getFirstName(),
                application.getJob().getTitle(),
                getCompanyName(application.getJob()),
                content,
                subject != null ? subject : "Job Offer: " + application.getJob().getTitle()
        );

        return updated;
    }

    /**
     * Accept an offer letter
     */
    public JobApplication acceptOffer(Long applicationId, Long jobSeekerId) {
        JobApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Application", "id", applicationId));

        if (!application.getJobSeeker().getId().equals(jobSeekerId)) {
            throw new CustomException(
                    "You can only accept your own offers", HttpStatus.FORBIDDEN);
        }

        if (application.getStatus() != ApplicationStatus.OFFERED) {
            throw new CustomException(
                    "No pending offer to accept", HttpStatus.BAD_REQUEST);
        }

        application.setStatus(ApplicationStatus.ACCEPTED);
        application.setStatusUpdatedAt(LocalDateTime.now());
        application.setOfferAcceptedAt(LocalDateTime.now());
        JobApplication updated = applicationRepository.save(application);

        String message = String.format("%s %s has ACCEPTED your offer for '%s'!",
                application.getJobSeeker().getFirstName(), application.getJobSeeker().getLastName(),
                application.getJob().getTitle());
        notificationService.sendNotification(application.getJob().getEmployer().getId(), "Offer Accepted", message, "OFFER", application.getId(), "APPLICATION");

        emailService.sendOfferAcceptedEmail(
                application.getJob().getEmployer().getEmail(),
                application.getJob().getEmployer().getFirstName(),
                application.getJobSeeker().getFirstName() + " " + application.getJobSeeker().getLastName(),
                application.getJob().getTitle(),
                getCompanyName(application.getJob())
        );

        return updated;
    }

    /**
     * Reject an offer letter
     */
    public JobApplication rejectOffer(Long applicationId, Long jobSeekerId) {
        JobApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Application", "id", applicationId));

        if (!application.getJobSeeker().getId().equals(jobSeekerId)) {
            throw new CustomException(
                    "You can only reject your own offers", HttpStatus.FORBIDDEN);
        }

        if (application.getStatus() != ApplicationStatus.OFFERED) {
            throw new CustomException(
                    "No pending offer to reject", HttpStatus.BAD_REQUEST);
        }

        application.setStatus(ApplicationStatus.REJECTED);
        application.setStatusUpdatedAt(LocalDateTime.now());
        JobApplication updated = applicationRepository.save(application);

        String message = String.format("%s %s has declined your offer for '%s'.",
                application.getJobSeeker().getFirstName(), application.getJobSeeker().getLastName(),
                application.getJob().getTitle());
        notificationService.sendNotification(application.getJob().getEmployer().getId(), "Offer Declined", message, "OFFER", application.getId(), "APPLICATION");

        return updated;
    }

    private String buildDefaultOfferLetter(JobApplication application, Double salary, String startDate) {
        Job job = application.getJob();
        String jobTitle = job.getTitle();
        String company = getCompanyName(job);
        String location = job.getLocation();
        String sal = salary != null ? String.format("₹%,.0f per annum", salary) :
                (job.getSalaryMin() != null && job.getSalaryMax() != null)
                        ? String.format("₹%,.0f - ₹%,.0f per annum", job.getSalaryMin(), job.getSalaryMax())
                        : "As discussed";
        String start = startDate != null ? startDate : "To be confirmed";

        StringBuilder sb = new StringBuilder();
        sb.append("OFFER LETTER\n\n");
        sb.append(String.format("Date: %s\n", java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("MMMM dd, yyyy"))));
        sb.append(String.format("To: %s %s\n", application.getJobSeeker().getFirstName(), application.getJobSeeker().getLastName()));
        sb.append(String.format("\nDear %s,\n\n", application.getJobSeeker().getFirstName()));
        sb.append(String.format("We are pleased to offer you the position of %s at %s, based in %s.\n\n", jobTitle, company, location));

        sb.append("POSITION DETAILS\n");
        sb.append(String.format("- Job Title: %s\n", jobTitle));
        sb.append(String.format("- Employment Type: %s\n", job.getJobType() != null ? job.getJobType() : "Full-time"));
        sb.append(String.format("- Salary: %s\n", sal));
        sb.append(String.format("- Start Date: %s\n", start));
        sb.append(String.format("- Location: %s\n", location));
        if (job.getPositionsAvailable() != null) {
            sb.append(String.format("- Positions Available: %d\n", job.getPositionsAvailable()));
        }
        if (job.getExperienceRequired() != null) {
            sb.append(String.format("- Experience Required: %s\n", job.getExperienceRequired()));
        }
        if (job.getEducationRequired() != null) {
            sb.append(String.format("- Education Required: %s\n", job.getEducationRequired()));
        }
        if (job.getSkills() != null && !job.getSkills().isBlank()) {
            sb.append(String.format("- Key Skills: %s\n", job.getSkills()));
        }

        if (job.getDescription() != null && !job.getDescription().isBlank()) {
            sb.append("\nJOB DESCRIPTION\n");
            sb.append(job.getDescription()).append("\n");
        }

        if (job.getRequirements() != null && !job.getRequirements().isBlank()) {
            sb.append("\nREQUIREMENTS\n");
            sb.append(job.getRequirements()).append("\n");
        }

        sb.append("\nThis offer is contingent upon successful completion of all pre-employment requirements.\n");
        sb.append("Please review this offer and respond at your earliest convenience.\n\n");
        sb.append("We look forward to welcoming you to our team!\n\n");
        sb.append(String.format("Best regards,\n%s\n%s\n", company, company));

        return sb.toString();
    }

    private String getCompanyName(Job job) {
        if (job.getEmployer() != null && job.getEmployer().getCompanyProfile() != null) {
            String name = job.getEmployer().getCompanyProfile().getCompanyName();
            if (name != null && !name.isBlank()) return name;
        }
        if (job.getEmployer() != null) {
            return job.getEmployer().getFirstName() + " " + job.getEmployer().getLastName();
        }
        return "Unknown Company";
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
        return applicationRepository.existsByJobAndJobSeekerAndStatusNot(job, jobSeeker, ApplicationStatus.WITHDRAWN);
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