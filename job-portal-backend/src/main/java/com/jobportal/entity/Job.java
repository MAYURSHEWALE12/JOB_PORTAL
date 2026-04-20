package com.jobportal.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Entity
@Table(name = "jobs", indexes = {
        @Index(name = "idx_job_status", columnList = "status"),
        @Index(name = "idx_job_employer", columnList = "employer_id"),
        @Index(name = "idx_job_type", columnList = "jobType"),
        @Index(name = "idx_job_expiry", columnList = "expiryDate"),
        @Index(name = "idx_job_created", columnList = "createdAt"),
        @Index(name = "idx_job_location", columnList = "location")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Job {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "employer_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User employer;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "LONGTEXT")
    private String description;

    @Column(columnDefinition = "LONGTEXT")
    private String requirements;

    private BigDecimal salaryMin;
    private BigDecimal salaryMax;

    @Column(nullable = false)
    private String location;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private JobType jobType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private JobStatus status;

    private String experienceRequired;
    private String educationRequired;
    private Integer positionsAvailable;
    private LocalDateTime expiryDate;

    @Column(columnDefinition = "TEXT")
    private String skills;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Column(columnDefinition = "INT DEFAULT 0")
    @Builder.Default
    private Integer viewCount = 0;

    @Column(columnDefinition = "INT DEFAULT 0")
    @Builder.Default
    private Integer applicationCount = 0;

    @Transient
    public String getCompanyName() {
        if (employer != null && employer.getCompanyProfile() != null) {
            return employer.getCompanyProfile().getCompanyName();
        }
        return employer != null ? employer.getFullName() : null;
    }

    @Transient
    public String getCompanyLogo() {
        if (employer != null && employer.getCompanyProfile() != null) {
            return employer.getCompanyProfile().getLogoUrl();
        }
        if (employer != null && employer.getProfileImageUrl() != null) {
            return employer.getProfileImageUrl();
        }
        return null;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        // ✅ status is NOT set here — JobService controls it
        if (viewCount == null) viewCount = 0;
        if (applicationCount == null) applicationCount = 0;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}