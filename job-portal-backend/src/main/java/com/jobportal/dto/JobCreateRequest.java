package com.jobportal.dto;

import com.jobportal.entity.JobType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobCreateRequest {

    @NotBlank(message = "Job title is required")
    private String title;

    private String description;

    private String requirements;

    private BigDecimal salaryMin;

    private BigDecimal salaryMax;

    @NotBlank(message = "Location is required")
    private String location;

    @NotNull(message = "Job type is required")
    private JobType jobType;

    private String experienceRequired;

    private String educationRequired;

    @Positive(message = "Positions must be positive")
    private Integer positionsAvailable;

    private LocalDateTime expiryDate;

    private String skills;
}
