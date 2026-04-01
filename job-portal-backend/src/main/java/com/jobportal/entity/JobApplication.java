package com.jobportal.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Entity
@Table(name = "job_applications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "job_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Job job;

    @ManyToOne
    @JoinColumn(name = "jobseeker_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User jobSeeker;

    @Column(columnDefinition = "LONGTEXT")
    private String coverLetter;

    @ManyToOne
    @JoinColumn(name = "resume_id")          // ✅ new field
    @OnDelete(action = OnDeleteAction.SET_NULL)
    private Resume selectedResume;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 25)
    private ApplicationStatus status;

    private Integer rating;

    @Column(columnDefinition = "LONGTEXT")
    private String feedback;

    @Column(nullable = false, updatable = false)
    private LocalDateTime appliedAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        appliedAt  = LocalDateTime.now();
        updatedAt  = LocalDateTime.now();
        status     = ApplicationStatus.PENDING;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}