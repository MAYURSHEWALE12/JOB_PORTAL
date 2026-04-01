package com.jobportal.service;

import com.jobportal.dto.*;
import com.jobportal.entity.*;
import com.jobportal.exception.CustomException;
import com.jobportal.exception.ResourceNotFoundException;
import com.jobportal.repository.JobApplicationRepository;
import com.jobportal.repository.JobRepository;
import com.jobportal.repository.QuizRepository;
import com.jobportal.repository.QuizResultRepository;
import com.jobportal.repository.ResumeAnalysisRepository;
import com.jobportal.repository.SavedJobRepository;
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

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class JobService {

    private final JobRepository jobRepository;
    private final UserRepository userRepository;
    private final JobAlertService jobAlertService;
    private final SavedJobRepository savedJobRepository;
    private final JobApplicationRepository applicationRepository;
    private final QuizResultRepository quizResultRepository;
    private final ResumeAnalysisRepository resumeAnalysisRepository;
    private final QuizRepository quizRepository;

    @Transactional(readOnly = true)
    public List<Job> getAllActiveJobs() {
        return jobRepository.findByStatus(JobStatus.ACTIVE);
    }

    @Transactional(readOnly = true)
    public PageResponse<Job> getAllActiveJobsPaginated(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Job> jobPage = jobRepository.findByStatus(JobStatus.ACTIVE, pageable);
        return toPageResponse(jobPage);
    }

    @Transactional(readOnly = true)
    public Job getJobById(Long id) {
        return jobRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Job", "id", id));
    }

    public Job getJobByIdWithViewCount(Long id) {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Job", "id", id));
        jobRepository.incrementViewCount(id);
        return job;
    }

    @Transactional(readOnly = true)
    public List<Job> searchJobs(String keyword, String location, String jobType) {
        JobType type = null;
        if (jobType != null && !jobType.isEmpty()) {
            try {
                type = JobType.valueOf(jobType.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new CustomException("Invalid job type: " + jobType, HttpStatus.BAD_REQUEST);
            }
        }

        String kw  = (keyword  != null && !keyword.isEmpty())  ? keyword  : null;
        String loc = (location != null && !location.isEmpty()) ? location : null;

        log.debug("Searching jobs — keyword: {}, location: {}, type: {}", kw, loc, type);
        return jobRepository.searchJobs(kw, loc, type);
    }

    @Transactional(readOnly = true)
    public PageResponse<Job> searchJobsPaginated(String keyword, String location, String jobType, int page, int size) {
        JobType type = null;
        if (jobType != null && !jobType.isEmpty()) {
            try {
                type = JobType.valueOf(jobType.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new CustomException("Invalid job type: " + jobType, HttpStatus.BAD_REQUEST);
            }
        }

        String kw  = (keyword  != null && !keyword.isEmpty())  ? keyword  : null;
        String loc = (location != null && !location.isEmpty()) ? location : null;

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Job> jobPage = jobRepository.searchJobs(kw, loc, type, pageable);
        return toPageResponse(jobPage);
    }

    @Transactional(readOnly = true)
    public PageResponse<Job> advancedSearch(JobSearchRequest request) {
        String kw = (request.getKeyword() != null && !request.getKeyword().isEmpty()) ? request.getKeyword() : null;
        String loc = (request.getLocation() != null && !request.getLocation().isEmpty()) ? request.getLocation() : null;
        String exp = (request.getExperienceLevel() != null && !request.getExperienceLevel().isEmpty()) ? request.getExperienceLevel() : null;
        String edu = (request.getEducationLevel() != null && !request.getEducationLevel().isEmpty()) ? request.getEducationLevel() : null;

        LocalDateTime sinceDate = null;
        if (request.getDaysPosted() != null && request.getDaysPosted() > 0) {
            sinceDate = LocalDateTime.now().minusDays(request.getDaysPosted());
        }

        Sort sort = buildSort(request.getSortBy(), request.getSortOrder());
        Pageable pageable = PageRequest.of(request.getPage(), request.getSize(), sort);

        Page<Job> jobPage = jobRepository.advancedSearch(
                kw, loc, request.getJobType(),
                request.getSalaryMin(), request.getSalaryMax(),
                exp, edu, request.getDaysPosted(), sinceDate,
                pageable
        );
        return toPageResponse(jobPage);
    }

    public Job createJob(Job job, Long employerId) {
        User employer = userRepository.findById(employerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", employerId));

        if (employer.getRole() != UserRole.EMPLOYER) {
            throw new CustomException("Only employers can post jobs", HttpStatus.FORBIDDEN);
        }

        job.setEmployer(employer);
        job.setStatus(JobStatus.ACTIVE);
        Job saved = jobRepository.save(job);
        log.info("Job created: {} by employer: {}", saved.getTitle(), employer.getEmail());

        jobAlertService.notifyMatchingUsers(saved);

        return saved;
    }

    public Job createJobFromDTO(JobCreateRequest request, Long employerId) {
        User employer = userRepository.findById(employerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", employerId));

        if (employer.getRole() != UserRole.EMPLOYER) {
            throw new CustomException("Only employers can post jobs", HttpStatus.FORBIDDEN);
        }

        Job job = Job.builder()
                .employer(employer)
                .title(request.getTitle())
                .description(request.getDescription())
                .requirements(request.getRequirements())
                .salaryMin(request.getSalaryMin())
                .salaryMax(request.getSalaryMax())
                .location(request.getLocation())
                .jobType(request.getJobType())
                .experienceRequired(request.getExperienceRequired())
                .educationRequired(request.getEducationRequired())
                .positionsAvailable(request.getPositionsAvailable())
                .expiryDate(request.getExpiryDate())
                .skills(request.getSkills())
                .status(JobStatus.ACTIVE)
                .viewCount(0)
                .applicationCount(0)
                .build();

        Job saved = jobRepository.save(job);
        log.info("Job created: {} by employer: {}", saved.getTitle(), employer.getEmail());

        jobAlertService.notifyMatchingUsers(saved);

        return saved;
    }

    public Job updateJob(Long jobId, Job updatedJob, Long employerId) {
        Job job = getJobById(jobId);

        if (!job.getEmployer().getId().equals(employerId)) {
            throw new CustomException("You can only edit your own jobs", HttpStatus.FORBIDDEN);
        }

        job.setTitle(updatedJob.getTitle());
        job.setDescription(updatedJob.getDescription());
        job.setRequirements(updatedJob.getRequirements());
        job.setLocation(updatedJob.getLocation());
        job.setJobType(updatedJob.getJobType());
        job.setSalaryMin(updatedJob.getSalaryMin());
        job.setSalaryMax(updatedJob.getSalaryMax());
        job.setExperienceRequired(updatedJob.getExperienceRequired());
        job.setEducationRequired(updatedJob.getEducationRequired());
        job.setPositionsAvailable(updatedJob.getPositionsAvailable());
        job.setExpiryDate(updatedJob.getExpiryDate());
        job.setSkills(updatedJob.getSkills());

        return jobRepository.save(job);
    }

    public Job updateJobFromDTO(Long jobId, JobUpdateRequest request, Long employerId) {
        Job job = getJobById(jobId);

        if (!job.getEmployer().getId().equals(employerId)) {
            throw new CustomException("You can only edit your own jobs", HttpStatus.FORBIDDEN);
        }

        job.setTitle(request.getTitle());
        job.setDescription(request.getDescription());
        job.setRequirements(request.getRequirements());
        job.setLocation(request.getLocation());
        job.setJobType(request.getJobType());
        job.setSalaryMin(request.getSalaryMin());
        job.setSalaryMax(request.getSalaryMax());
        job.setExperienceRequired(request.getExperienceRequired());
        job.setEducationRequired(request.getEducationRequired());
        job.setPositionsAvailable(request.getPositionsAvailable());
        job.setExpiryDate(request.getExpiryDate());
        job.setSkills(request.getSkills());

        return jobRepository.save(job);
    }

    public void deleteJob(Long jobId, Long employerId) {
        Job job = getJobById(jobId);

        if (!job.getEmployer().getId().equals(employerId)) {
            throw new CustomException("You can only delete your own jobs", HttpStatus.FORBIDDEN);
        }

        quizRepository.findByJob(job).ifPresent(quizRepository::delete);
        List<JobApplication> applications = applicationRepository.findByJob(job);
        for (JobApplication app : applications) {
            quizResultRepository.findByApplication(app).ifPresent(quizResultRepository::delete);
        }
        resumeAnalysisRepository.deleteAll(resumeAnalysisRepository.findByJob(job));
        savedJobRepository.deleteAll(savedJobRepository.findByJob(job));
        applicationRepository.deleteAll(applications);
        jobRepository.delete(job);
        log.info("Job deleted: {}", jobId);
    }

    @Transactional(readOnly = true)
    public List<Job> getJobsByEmployer(Long employerId) {
        User employer = userRepository.findById(employerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", employerId));
        return jobRepository.findByEmployer(employer);
    }

    @Transactional(readOnly = true)
    public PageResponse<Job> getJobsByEmployerPaginated(Long employerId, int page, int size) {
        User employer = userRepository.findById(employerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", employerId));
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Job> jobPage = jobRepository.findByEmployer(employer, pageable);
        return toPageResponse(jobPage);
    }

    public Job closeJob(Long jobId, Long employerId) {
        Job job = getJobById(jobId);

        if (!job.getEmployer().getId().equals(employerId)) {
            throw new CustomException("You can only close your own jobs", HttpStatus.FORBIDDEN);
        }

        job.setStatus(JobStatus.CLOSED);
        return jobRepository.save(job);
    }

    public Job cloneJob(Long jobId, Long employerId) {
        Job original = getJobById(jobId);

        if (!original.getEmployer().getId().equals(employerId)) {
            throw new CustomException("You can only clone your own jobs", HttpStatus.FORBIDDEN);
        }

        Job cloned = Job.builder()
                .employer(original.getEmployer())
                .title(original.getTitle() + " (Copy)")
                .description(original.getDescription())
                .requirements(original.getRequirements())
                .salaryMin(original.getSalaryMin())
                .salaryMax(original.getSalaryMax())
                .location(original.getLocation())
                .jobType(original.getJobType())
                .experienceRequired(original.getExperienceRequired())
                .educationRequired(original.getEducationRequired())
                .positionsAvailable(original.getPositionsAvailable())
                .expiryDate(original.getExpiryDate() != null ? original.getExpiryDate().plusMonths(1) : null)
                .skills(original.getSkills())
                .status(JobStatus.ACTIVE)
                .viewCount(0)
                .applicationCount(0)
                .build();

        Job saved = jobRepository.save(cloned);
        log.info("Job cloned: {} -> {}", original.getId(), saved.getId());
        return saved;
    }

    @Transactional(readOnly = true)
    public PageResponse<Job> getRecommendedJobs(Long userId, int page, int size) {
        List<JobAlertPreference> preferences = null;
        try {
            preferences = jobAlertService.getUserAlerts(userId);
        } catch (Exception e) {
            log.debug("No alert preferences found for user {}", userId);
        }

        List<JobType> preferredTypes = new ArrayList<>();
        String preferredLocation = null;
        BigDecimal salaryMin = null;
        BigDecimal salaryMax = null;

        if (preferences != null && !preferences.isEmpty()) {
            JobAlertPreference pref = preferences.get(0);
            if (pref.getJobType() != null && !pref.getJobType().isBlank()) {
                try {
                    preferredTypes.add(JobType.valueOf(pref.getJobType().toUpperCase()));
                } catch (IllegalArgumentException ignored) {}
            }
            if (pref.getLocation() != null && !pref.getLocation().isBlank()) {
                preferredLocation = pref.getLocation();
            }
            if (pref.getSalaryMin() != null && pref.getSalaryMin() > 0) {
                salaryMin = BigDecimal.valueOf(pref.getSalaryMin());
            }
        }

        List<Long> savedJobIds = new ArrayList<>();
        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user != null) {
                savedJobIds = savedJobRepository.findByUser(user).stream()
                        .map(sj -> sj.getJob().getId())
                        .collect(Collectors.toList());
            }
        } catch (Exception e) {
            log.debug("Could not fetch saved jobs for user {}", userId);
        }
        if (savedJobIds.isEmpty()) {
            savedJobIds.add(-1L);
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Job> jobPage = jobRepository.findRecommendedJobs(
                preferredTypes.isEmpty() ? null : preferredTypes,
                preferredLocation, salaryMin, salaryMax, savedJobIds, pageable
        );
        return toPageResponse(jobPage);
    }

    @Transactional(readOnly = true)
    public JobAnalyticsDTO getJobAnalytics(Long jobId, Long employerId) {
        Job job = getJobById(jobId);

        if (!job.getEmployer().getId().equals(employerId)) {
            throw new CustomException("You can only view analytics for your own jobs", HttpStatus.FORBIDDEN);
        }

        List<JobApplication> applications = applicationRepository.findByJob(job);
        long totalApplications = applications.size();

        Map<ApplicationStatus, Long> byStatus = applications.stream()
                .collect(Collectors.groupingBy(JobApplication::getStatus, Collectors.counting()));

        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);

        long last7Days = applications.stream().filter(a -> a.getAppliedAt().isAfter(sevenDaysAgo)).count();
        long last30Days = applications.stream().filter(a -> a.getAppliedAt().isAfter(thirtyDaysAgo)).count();

        double viewToAppRate = job.getViewCount() > 0
                ? (double) totalApplications / job.getViewCount() * 100
                : 0.0;

        return JobAnalyticsDTO.builder()
                .jobId(jobId)
                .jobTitle(job.getTitle())
                .viewCount(job.getViewCount())
                .applicationCount(job.getApplicationCount())
                .totalApplications(totalApplications)
                .applicationsByStatus(byStatus)
                .applicationsLast7Days(last7Days)
                .applicationsLast30Days(last30Days)
                .viewToApplicationRate(Math.round(viewToAppRate * 100.0) / 100.0)
                .build();
    }

    @Transactional
    public int expireJobs() {
        int expired = jobRepository.expireJobs(LocalDateTime.now());
        if (expired > 0) {
            log.info("Auto-expired {} jobs", expired);
        }
        return expired;
    }

    private Sort buildSort(String sortBy, String sortOrder) {
        Sort.Direction dir = "asc".equalsIgnoreCase(sortOrder) ? Sort.Direction.ASC : Sort.Direction.DESC;

        if (sortBy == null) {
            return Sort.by(dir, "createdAt");
        }

        return switch (sortBy.toLowerCase()) {
            case "salary" -> Sort.by(dir, "salaryMax");
            case "title" -> Sort.by(dir, "title");
            case "location" -> Sort.by(dir, "location");
            case "views" -> Sort.by(dir, "viewCount");
            case "applications" -> Sort.by(dir, "applicationCount");
            default -> Sort.by(dir, "createdAt");
        };
    }

    private <T> PageResponse<T> toPageResponse(Page<T> page) {
        return PageResponse.<T>builder()
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
