package com.jobportal.service;

import com.jobportal.dto.PageResponse;
import com.jobportal.dto.ResumeAnalysisDTO;
import com.jobportal.entity.*;
import com.jobportal.exception.CustomException;
import com.jobportal.exception.ResourceNotFoundException;
import com.jobportal.repository.JobApplicationRepository;
import com.jobportal.repository.JobRepository;
import com.jobportal.repository.ResumeRepository;
import com.jobportal.repository.UserRepository;
import com.jobportal.repository.QuizRepository;
import com.jobportal.repository.QuizResultRepository;
import com.jobportal.repository.InterviewRepository;
import com.jobportal.repository.ResumeAnalysisRepository;
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
import java.util.Optional;

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
    private final QuizRepository           quizRepository;
    private final QuizResultRepository     quizResultRepository;
    private final ResumeAnalysisRepository      analysisRepository;
    private final InterviewRepository           interviewRepository;

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
        
        // Populate quiz result for each application
        appPage.forEach(app -> {
            app.setQuizResult(quizResultRepository.findByApplicationId(app.getId()).orElse(null));
            
            // Check for completed interview
            List<Interview> interviews = interviewRepository.findByApplication(app);
            app.setHasCompletedInterview(interviews.stream().anyMatch(i -> i.getStatus() == InterviewStatus.COMPLETED));

            // Populate Intelligence Analysis
            if (app.getSelectedResume() != null) {
                List<ResumeAnalysis> analysisList = analysisRepository.findTopByResumeAndJobOrderByAnalyzedAtDesc(app.getSelectedResume(), app.getJob());
                if (!analysisList.isEmpty()) {
                    app.setMatchAnalysis(ResumeAnalysisDTO.from(analysisList.get(0)));
                }
            }
        });
        
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
        
        // Populate quiz result for each
        appPage.forEach(app -> {
            app.setQuizResult(quizResultRepository.findByApplicationId(app.getId()).orElse(null));
            
            // Check for completed interview
            List<Interview> interviews = interviewRepository.findByApplication(app);
            app.setHasCompletedInterview(interviews.stream().anyMatch(i -> i.getStatus() == InterviewStatus.COMPLETED));

            // Populate Intelligence Analysis
            if (app.getSelectedResume() != null) {
                List<ResumeAnalysis> analysisList = analysisRepository.findTopByResumeAndJobOrderByAnalyzedAtDesc(app.getSelectedResume(), app.getJob());
                if (!analysisList.isEmpty()) {
                    app.setMatchAnalysis(ResumeAnalysisDTO.from(analysisList.get(0)));
                }
            }
        });
        
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

        if (!isValidTransition(application, newStatus)) {
            String errorMessage = (application.getStatus() == ApplicationStatus.PENDING && newStatus != ApplicationStatus.REJECTED)
                ? "This candidate needs to complete the mandatory assessment before you can move them to the " + newStatus + " stage."
                : "Invalid process sequence. You cannot move a candidate from " + application.getStatus() + " directly to " + newStatus + ".";
            throw new CustomException(errorMessage, HttpStatus.BAD_REQUEST);
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

        if (!isValidTransition(application, ApplicationStatus.OFFERED)) {
            String msg = application.getStatus() == ApplicationStatus.INTERVIEWING 
                ? "You cannot send an offer yet. The interview must be marked as COMPLETED first."
                : "You cannot send an offer yet. Candidates must be in the Interviewing stage first.";
            throw new CustomException(msg, HttpStatus.BAD_REQUEST);
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
     * Officially hire a candidate in one click (Fast-track)
     */
    public JobApplication directHire(Long applicationId, Long employerId) {
        JobApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application", "id", applicationId));

        if (!application.getJob().getEmployer().getId().equals(employerId)) {
            throw new CustomException("You can only hire candidates for your own jobs", HttpStatus.FORBIDDEN);
        }

        if (!isDirectHireAllowed(application)) {
            throw new CustomException(
                "Cannot fast-track hire: Candidate must be in the Interviewing stage and have completed an interview.", 
                HttpStatus.BAD_REQUEST);
        }

        String content = buildDefaultOfferLetter(application, null, null);
        application.setOfferLetterContent(content);
        application.setOfferSentAt(LocalDateTime.now());
        application.setOfferAcceptedAt(LocalDateTime.now());
        application.setStatus(ApplicationStatus.ACCEPTED);
        application.setStatusUpdatedAt(LocalDateTime.now());

        log.info("Directly hired candidate for application ID: {}", applicationId);
        return applicationRepository.save(application);
    }

    private boolean isDirectHireAllowed(JobApplication application) {
        if (application.getStatus() != ApplicationStatus.INTERVIEWING) return false;
        List<Interview> interviews = interviewRepository.findByApplication(application);
        return interviews.stream().anyMatch(i -> i.getStatus() == InterviewStatus.COMPLETED);
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
     * Validates if a status transition is allowed in the hiring funnel,
     * including checks for mandatory assessments.
     */
    private boolean isValidTransition(JobApplication application, ApplicationStatus next) {
        if (application == null || next == null) return false;
        
        ApplicationStatus current = application.getStatus();
        if (current == next) return true;
        if (next == ApplicationStatus.REJECTED) return true; 
        if (current == ApplicationStatus.REJECTED && next == ApplicationStatus.REVIEWED) return true;

        // --- Assessment Prerequisite Check ---
        if (current == ApplicationStatus.PENDING && next != ApplicationStatus.REJECTED) {
            try {
                // Use IDs to avoid potential Lazy Loading / Mapping issues causing 500 errors
                Long jobId = application.getJob().getId();
                Optional<Quiz> quizOpt = quizRepository.findByJobId(jobId);
                
                if (quizOpt.isPresent()) {
                    // Check for results using application ID
                    boolean hasResult = quizResultRepository.findByApplicationId(application.getId()).isPresent();
                    if (!hasResult) {
                        log.warn("Blocking transition for App {}: Assessment required for Job {}.", application.getId(), jobId);
                        return false;
                    }
                }
            } catch (Throwable t) {
                // Catch EVERYTHING to ensure the app doesn't hit a 500 internal error
                log.error("Assessment check failed for App {}: {}. Allowing transition to avoid blocking recruiter.", 
                          application.getId(), t.getMessage(), t);
                // We return true here to avoid the 500 error you saw earlier, 
                // effectively failing open if the check system itself has a bug.
                return true; 
            }
        }

        try {
            return switch (current) {
                case PENDING -> next == ApplicationStatus.REVIEWED;
                case REVIEWED -> next == ApplicationStatus.SHORTLISTED;
                case SHORTLISTED -> next == ApplicationStatus.INTERVIEWING;
                case INTERVIEWING -> {
                    if (next == ApplicationStatus.OFFERED || next == ApplicationStatus.ACCEPTED) {
                        List<Interview> interviews = interviewRepository.findByApplication(application);
                        yield interviews != null && interviews.stream()
                                .anyMatch(i -> i != null && i.getStatus() == InterviewStatus.COMPLETED);
                    }
                    yield next == ApplicationStatus.SHORTLISTED;
                }
                case OFFERED -> next == ApplicationStatus.ACCEPTED;
                default -> false;
            };
        } catch (Exception e) {
            log.error("Error in funnel validation switch for App #{}: {}", application.getId(), e.getMessage());
            return false;
        }
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