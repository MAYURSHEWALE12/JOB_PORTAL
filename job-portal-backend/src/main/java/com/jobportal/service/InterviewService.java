package com.jobportal.service;

import com.jobportal.dto.InterviewDTO;
import com.jobportal.entity.*;
import com.jobportal.exception.BadRequestException;
import com.jobportal.exception.ResourceNotFoundException;
import com.jobportal.repository.InterviewRepository;
import com.jobportal.repository.JobApplicationRepository;
import com.jobportal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class InterviewService {

    private final InterviewRepository interviewRepository;
    private final JobApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final NotificationService notificationService;

    public InterviewDTO scheduleInterview(Long applicationId, Long interviewerId, InterviewDTO dto) {
        JobApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("JobApplication", "id", applicationId));

        User interviewer = userRepository.findById(interviewerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", interviewerId));

        User candidate = application.getJobSeeker();

        if (dto.getScheduledAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Interview cannot be scheduled in the past");
        }

        Interview interview = Interview.builder()
                .application(application)
                .interviewer(interviewer)
                .candidate(candidate)
                .title(dto.getTitle())
                .scheduledAt(dto.getScheduledAt())
                .durationMinutes(dto.getDurationMinutes())
                .location(dto.getLocation())
                .meetingLink(dto.getMeetingLink())
                .description(dto.getDescription())
                .status(InterviewStatus.SCHEDULED)
                .calendarInviteSent(false)
                .reminderSent24h(false)
                .reminderSent1h(false)
                .build();

        Interview saved = interviewRepository.save(interview);
        log.info("Interview scheduled: {} for candidate {} at {}", saved.getTitle(), candidate.getEmail(), saved.getScheduledAt());

        sendInterviewNotification(saved);
        sendInterviewEmails(saved);

        return convertToDTO(saved);
    }

    public InterviewDTO confirmInterview(Long interviewId) {
        Interview interview = getInterviewEntity(interviewId);
        interview.setStatus(InterviewStatus.CONFIRMED);
        Interview saved = interviewRepository.save(interview);
        log.info("Interview confirmed: {}", interviewId);
        return convertToDTO(saved);
    }

    public InterviewDTO cancelInterview(Long interviewId) {
        Interview interview = getInterviewEntity(interviewId);
        interview.setStatus(InterviewStatus.CANCELLED);
        Interview saved = interviewRepository.save(interview);
        log.info("Interview cancelled: {}", interviewId);

        notificationService.sendNotification(
                interview.getCandidate().getId(),
                "Interview Cancelled",
                "Your interview for " + interview.getTitle() + " has been cancelled.",
                "WARNING"
        );

        return convertToDTO(saved);
    }

    public InterviewDTO completeInterview(Long interviewId, String feedback, Integer rating) {
        Interview interview = getInterviewEntity(interviewId);
        interview.setStatus(InterviewStatus.COMPLETED);
        interview.setFeedback(feedback);
        interview.setRating(rating);
        Interview saved = interviewRepository.save(interview);
        log.info("Interview completed: {}", interviewId);
        return convertToDTO(saved);
    }

    public InterviewDTO rescheduleInterview(Long interviewId, LocalDateTime newTime) {
        Interview interview = getInterviewEntity(interviewId);

        if (newTime.isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Interview cannot be rescheduled to a past time");
        }

        interview.setScheduledAt(newTime);
        interview.setReminderSent24h(false);
        interview.setReminderSent1h(false);
        Interview saved = interviewRepository.save(interview);
        log.info("Interview rescheduled: {} to {}", interviewId, newTime);

        sendInterviewNotification(saved);
        sendInterviewEmails(saved);

        return convertToDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<InterviewDTO> getCandidateInterviews(Long candidateId) {
        return interviewRepository.findByCandidateId(candidateId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<InterviewDTO> getInterviewerInterviews(Long interviewerId) {
        return interviewRepository.findByInterviewerId(interviewerId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<InterviewDTO> getApplicationInterviews(Long applicationId) {
        return interviewRepository.findByApplication(
                applicationRepository.findById(applicationId)
                        .orElseThrow(() -> new ResourceNotFoundException("JobApplication", "id", applicationId))
        ).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public InterviewDTO getInterviewById(Long id) {
        return convertToDTO(
                interviewRepository.findById(id)
                        .orElseThrow(() -> new ResourceNotFoundException("Interview", "id", id))
        );
    }

    private Interview getInterviewEntity(Long id) {
        return interviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Interview", "id", id));
    }

    public void sendReminders() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime reminder24h = now.plusHours(24);
        LocalDateTime reminder1h = now.plusHours(1);
        List<InterviewStatus> activeStatuses = Arrays.asList(InterviewStatus.SCHEDULED, InterviewStatus.CONFIRMED);

        List<Interview> reminders24h = interviewRepository.findUpcoming24hReminders(reminder24h, activeStatuses);
        for (Interview interview : reminders24h) {
            send24hReminder(interview);
            interview.setReminderSent24h(true);
            interviewRepository.save(interview);
            log.info("24h reminder sent for interview: {}", interview.getId());
        }

        List<Interview> reminders1h = interviewRepository.findUpcoming1hReminders(reminder1h, activeStatuses);
        for (Interview interview : reminders1h) {
            send1hReminder(interview);
            interview.setReminderSent1h(true);
            interviewRepository.save(interview);
            log.info("1h reminder sent for interview: {}", interview.getId());
        }
    }

    private void sendInterviewNotification(Interview interview) {
        notificationService.sendNotification(
                interview.getCandidate().getId(),
                "Interview Scheduled",
                "You have an interview for " + interview.getTitle() + " on " + formatDateTime(interview.getScheduledAt()),
                "INFO"
        );

        notificationService.sendNotification(
                interview.getInterviewer().getId(),
                "Interview Scheduled",
                "You have an interview for " + interview.getTitle() + " on " + formatDateTime(interview.getScheduledAt()),
                "INFO"
        );
    }

    private void sendInterviewEmails(Interview interview) {
        String candidateName = interview.getCandidate().getFirstName();
        String interviewerName = interview.getInterviewer().getFirstName();
        String jobTitle = interview.getApplication().getJob().getTitle();
        String companyName = interview.getApplication().getJob().getEmployer().getCompanyProfile() != null
                ? interview.getApplication().getJob().getEmployer().getCompanyProfile().getCompanyName()
                : interview.getInterviewer().getFullName();

        emailService.sendInterviewScheduledEmail(
                interview.getCandidate().getEmail(),
                candidateName,
                interview.getTitle(),
                jobTitle,
                companyName,
                interview.getScheduledAt(),
                interview.getDurationMinutes(),
                interview.getLocation(),
                interview.getMeetingLink(),
                interview.getDescription()
        );

        emailService.sendInterviewScheduledEmail(
                interview.getInterviewer().getEmail(),
                interviewerName,
                interview.getTitle(),
                jobTitle,
                companyName,
                interview.getScheduledAt(),
                interview.getDurationMinutes(),
                interview.getLocation(),
                interview.getMeetingLink(),
                interview.getDescription()
        );
    }

    private void send24hReminder(Interview interview) {
        String candidateName = interview.getCandidate().getFirstName();
        String jobTitle = interview.getApplication().getJob().getTitle();
        String companyName = interview.getApplication().getJob().getEmployer().getCompanyProfile() != null
                ? interview.getApplication().getJob().getEmployer().getCompanyProfile().getCompanyName()
                : interview.getInterviewer().getFullName();

        emailService.sendInterviewReminderEmail(
                interview.getCandidate().getEmail(),
                candidateName,
                interview.getTitle(),
                jobTitle,
                companyName,
                interview.getScheduledAt(),
                interview.getLocation(),
                interview.getMeetingLink()
        );

        notificationService.sendNotification(
                interview.getCandidate().getId(),
                "Interview Reminder",
                "Your interview for " + interview.getTitle() + " is tomorrow at " + formatTime(interview.getScheduledAt()),
                "INFO"
        );
    }

    private void send1hReminder(Interview interview) {
        String candidateName = interview.getCandidate().getFirstName();
        String jobTitle = interview.getApplication().getJob().getTitle();

        emailService.sendInterviewReminderEmail(
                interview.getCandidate().getEmail(),
                candidateName,
                interview.getTitle(),
                jobTitle,
                "Company",
                interview.getScheduledAt(),
                interview.getLocation(),
                interview.getMeetingLink()
        );

        notificationService.sendNotification(
                interview.getCandidate().getId(),
                "Interview Starting Soon",
                "Your interview for " + interview.getTitle() + " starts in 1 hour!",
                "URGENT"
        );
    }

    private InterviewDTO convertToDTO(Interview interview) {
        String companyName = "";
        if (interview.getApplication().getJob().getEmployer().getCompanyProfile() != null) {
            companyName = interview.getApplication().getJob().getEmployer().getCompanyProfile().getCompanyName();
        }

        return InterviewDTO.builder()
                .id(interview.getId())
                .applicationId(interview.getApplication().getId())
                .interviewerId(interview.getInterviewer().getId())
                .candidateId(interview.getCandidate().getId())
                .title(interview.getTitle())
                .scheduledAt(interview.getScheduledAt())
                .durationMinutes(interview.getDurationMinutes())
                .location(interview.getLocation())
                .meetingLink(interview.getMeetingLink())
                .description(interview.getDescription())
                .status(interview.getStatus())
                .feedback(interview.getFeedback())
                .rating(interview.getRating())
                .jobTitle(interview.getApplication().getJob().getTitle())
                .companyName(companyName)
                .candidateName(interview.getCandidate().getFullName())
                .interviewerName(interview.getInterviewer().getFullName())
                .createdAt(interview.getCreatedAt())
                .updatedAt(interview.getUpdatedAt())
                .build();
    }

    private String formatDateTime(LocalDateTime dt) {
        return dt.format(DateTimeFormatter.ofPattern("MMM dd, yyyy 'at' hh:mm a"));
    }

    private String formatTime(LocalDateTime dt) {
        return dt.format(DateTimeFormatter.ofPattern("hh:mm a"));
    }
}
