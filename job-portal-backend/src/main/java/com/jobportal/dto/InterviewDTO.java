package com.jobportal.dto;

import com.jobportal.entity.InterviewStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewDTO {
    private Long id;
    private Long applicationId;
    private Long interviewerId;
    private Long candidateId;

    @NotBlank(message = "Title is required")
    private String title;

    @NotNull(message = "Scheduled time is required")
    private LocalDateTime scheduledAt;

    @NotNull(message = "Duration is required")
    @Positive(message = "Duration must be positive")
    private Integer durationMinutes;

    private String location;
    private String meetingLink;
    private String description;
    private InterviewStatus status;
    private String feedback;
    private Integer rating;

    private String jobTitle;
    private String companyName;
    private String candidateName;
    private String interviewerName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
