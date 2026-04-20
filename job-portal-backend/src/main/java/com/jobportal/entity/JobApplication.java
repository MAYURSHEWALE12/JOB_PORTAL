package com.jobportal.entity;

import com.jobportal.dto.ResumeAnalysisDTO;
import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Entity
@Table(name = "job_applications", indexes = {
    @Index(name = "idx_app_job", columnList = "job_id"),
    @Index(name = "idx_app_jobseeker", columnList = "jobseeker_id"),
    @Index(name = "idx_app_jobseeker_status", columnList = "jobseeker_id, status"),
    @Index(name = "idx_app_job_employer", columnList = "job_id, status"),
    @Index(name = "idx_app_resume", columnList = "resume_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Transient
    private QuizResult quizResult; // ✅ added for frontend visibility

    @Transient
    private boolean hasCompletedInterview; // ✅ added for frontend visibility

    @Transient
    private ResumeAnalysisDTO matchAnalysis; // ✅ changed to DTO for Vertex Intelligence

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "job_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Job job;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "jobseeker_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User jobSeeker;

    @Column(columnDefinition = "LONGTEXT")
    private String coverLetter;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "resume_id")
    @OnDelete(action = OnDeleteAction.SET_NULL)
    private Resume selectedResume;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 25)
    private ApplicationStatus status;

    private Integer rating;

    @Column(columnDefinition = "LONGTEXT")
    private String feedback;

    @Column(columnDefinition = "LONGTEXT")
    private String offerLetterContent;

    private LocalDateTime offerSentAt;

    private LocalDateTime offerAcceptedAt;

    @Column(nullable = false, updatable = false)
    private LocalDateTime appliedAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    private LocalDateTime statusUpdatedAt;

    @PrePersist
    protected void onCreate() {
        appliedAt  = LocalDateTime.now();
        updatedAt  = LocalDateTime.now();
        status     = ApplicationStatus.PENDING;
        statusUpdatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}