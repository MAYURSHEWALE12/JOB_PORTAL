package com.jobportal.service;

import com.jobportal.entity.Job;
import com.jobportal.entity.JobAlertPreference;
import com.jobportal.entity.User;
import com.jobportal.repository.JobAlertPreferenceRepository;
import com.jobportal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class JobAlertService {

    private final JobAlertPreferenceRepository alertRepo;
    private final UserRepository userRepo;
    private final NotificationService notificationService;
    private final EmailService emailService;

    @Transactional(readOnly = true)
    public List<JobAlertPreference> getUserAlerts(Long userId) {
        return alertRepo.findByUserIdAndIsActiveTrue(userId);
    }

    public JobAlertPreference createAlert(Long userId, JobAlertPreference preference) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        preference.setUser(user);
        if (preference.getIsActive() == null) preference.setIsActive(true);
        if (preference.getEmailEnabled() == null) preference.setEmailEnabled(true);
        if (preference.getInAppEnabled() == null) preference.setInAppEnabled(true);
        return alertRepo.save(preference);
    }

    public JobAlertPreference updateAlert(Long alertId, JobAlertPreference updated) {
        JobAlertPreference existing = alertRepo.findById(alertId)
                .orElseThrow(() -> new RuntimeException("Alert not found: " + alertId));
        if (updated.getKeywords() != null) existing.setKeywords(updated.getKeywords());
        if (updated.getLocation() != null) existing.setLocation(updated.getLocation());
        if (updated.getJobType() != null) existing.setJobType(updated.getJobType());
        if (updated.getSalaryMin() != null) existing.setSalaryMin(updated.getSalaryMin());
        if (updated.getEmailEnabled() != null) existing.setEmailEnabled(updated.getEmailEnabled());
        if (updated.getInAppEnabled() != null) existing.setInAppEnabled(updated.getInAppEnabled());
        if (updated.getIsActive() != null) existing.setIsActive(updated.getIsActive());
        return alertRepo.save(existing);
    }

    public JobAlertPreference updateAlertForUser(Long alertId, JobAlertPreference updated, Long userId) {
        JobAlertPreference existing = alertRepo.findById(alertId)
                .orElseThrow(() -> new RuntimeException("Alert not found: " + alertId));
        if (!existing.getUser().getId().equals(userId)) {
            throw new RuntimeException("You can only update your own alerts");
        }
        return updateAlert(alertId, updated);
    }

    public void deleteAlert(Long alertId, Long userId) {
        JobAlertPreference alert = alertRepo.findById(alertId)
                .orElseThrow(() -> new RuntimeException("Alert not found: " + alertId));
        if (!alert.getUser().getId().equals(userId)) {
            throw new RuntimeException("You can only delete your own alerts");
        }
        alertRepo.deleteById(alertId);
    }

    @Transactional
    public void notifyMatchingUsers(Job job) {
        List<JobAlertPreference> activeAlerts = alertRepo.findByIsActiveTrue();
        log.info("Checking {} active job alert preferences for new job: {}", activeAlerts.size(), job.getTitle());

        for (JobAlertPreference alert : activeAlerts) {
            if (!matchesJob(alert, job)) continue;

            User user = alert.getUser();
            log.info("Job {} matches alert for user {} ({})", job.getTitle(), user.getEmail(), user.getId());

            // Always send in-app notification if enabled
            if (Boolean.TRUE.equals(alert.getInAppEnabled())) {
                notificationService.sendNotification(
                        user.getId(),
                        "New Job Match: " + job.getTitle(),
                        "A new job matches your alert: " + job.getTitle() + " at " + getCompanyName(job) + " in " + job.getLocation(),
                        "JOB_ALERT",
                        job.getId(),
                        "JOB"
                );
            }

            // Attempt email if enabled (graceful failure)
            if (Boolean.TRUE.equals(alert.getEmailEnabled())) {
                log.info("Attempting to send email to {} for job {}", user.getEmail(), job.getTitle());
                boolean sent = emailService.sendJobAlertEmail(user.getEmail(), user.getFirstName(), job);
                if (sent) {
                    log.info("Email sent successfully to {}", user.getEmail());
                } else {
                    log.warn("Email NOT sent for user {} (SMTP issue or failed). In-app notification delivered.", user.getEmail());
                }
            } else {
                log.info("Email disabled for alert {}, skipping email", alert.getId());
            }
        }
    }

    private boolean matchesJob(JobAlertPreference alert, Job job) {
        // Keywords match
        if (alert.getKeywords() != null && !alert.getKeywords().isBlank()) {
            List<String> keywords = Arrays.stream(alert.getKeywords().split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .map(String::toLowerCase)
                    .collect(Collectors.toList());

            String jobText = (job.getTitle() + " " + job.getDescription() + " " + job.getRequirements() + " " + (job.getSkills() != null ? job.getSkills() : "")).toLowerCase();
            boolean keywordMatch = keywords.stream().anyMatch(jobText::contains);
            if (!keywordMatch) return false;
        }

        // Location match
        if (alert.getLocation() != null && !alert.getLocation().isBlank()) {
            if (!job.getLocation().toLowerCase().contains(alert.getLocation().toLowerCase())) {
                return false;
            }
        }

        // Job type match
        if (alert.getJobType() != null && !alert.getJobType().isBlank()) {
            if (!alert.getJobType().equalsIgnoreCase(job.getJobType().name())) {
                return false;
            }
        }

        // Salary match
        if (alert.getSalaryMin() != null && alert.getSalaryMin() > 0) {
            java.math.BigDecimal jobSalary = job.getSalaryMax() != null ? job.getSalaryMax() : job.getSalaryMin();
            if (jobSalary == null || jobSalary.compareTo(java.math.BigDecimal.valueOf(alert.getSalaryMin())) < 0) {
                log.info("Job {} salary ({}) too low for alert min ({})", job.getTitle(), jobSalary, alert.getSalaryMin());
                return false;
            }
        }

        log.info("MATCH FOUND: Job {} matches alert {}", job.getTitle(), alert.getId());
        return true;
    }

    private String getCompanyName(Job job) {
        if (job.getEmployer() != null && job.getEmployer().getCompanyProfile() != null) {
            return job.getEmployer().getCompanyProfile().getCompanyName();
        }
        if (job.getEmployer() != null) {
            return job.getEmployer().getFirstName() + " " + job.getEmployer().getLastName();
        }
        return "Unknown Company";
    }
}
