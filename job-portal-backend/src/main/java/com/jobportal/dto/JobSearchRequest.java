package com.jobportal.dto;

import com.jobportal.entity.JobType;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobSearchRequest {

    private String keyword;

    private String location;

    private JobType jobType;

    private BigDecimal salaryMin;

    private BigDecimal salaryMax;

    private String experienceLevel;

    private String educationLevel;

    private Integer daysPosted;

    private String sortBy;

    private String sortOrder;

    private int page;

    private int size;
}
