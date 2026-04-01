package com.jobportal.dto;

import com.jobportal.entity.ApplicationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobAnalyticsDTO {

    private Long jobId;
    private String jobTitle;
    private Integer viewCount;
    private Integer applicationCount;
    private Long totalApplications;
    private Map<ApplicationStatus, Long> applicationsByStatus;
    private Long applicationsLast7Days;
    private Long applicationsLast30Days;
    private Double viewToApplicationRate;
}
