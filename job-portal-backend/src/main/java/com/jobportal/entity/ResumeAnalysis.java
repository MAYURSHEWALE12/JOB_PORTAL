package com.jobportal.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalDateTime;
import java.util.List;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Entity
@Table(name = "resume_analyses", indexes = {
    @Index(name = "idx_analysis_user", columnList = "user_id"),
    @Index(name = "idx_analysis_resume", columnList = "resume_id"),
    @Index(name = "idx_analysis_job", columnList = "job_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ResumeAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JsonIgnore
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resume_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JsonIgnore
    private Resume resume;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id")
    @OnDelete(action = OnDeleteAction.SET_NULL)
    @JsonIgnore
    private Job job; // Optional: analysis for a specific job

    private Integer score; // Overall ATS Score (0-100)

    @Convert(converter = StringListConverter.class)
    @Column(name = "suggestions", columnDefinition = "LONGTEXT")
    private List<String> suggestions;

    @Convert(converter = StringListConverter.class)
    @Column(name = "strengths", columnDefinition = "LONGTEXT")
    private List<String> strengths;

    @Convert(converter = StringListConverter.class)
    @Column(name = "interview_questions", columnDefinition = "LONGTEXT")
    private List<String> interviewQuestions;

    @Column(columnDefinition = "LONGTEXT")
    private String skillAlignmentJson; // Categorized match data (Technical, Soft, etc.)

    @Column(columnDefinition = "LONGTEXT")
    private String matchDetails; // JSON/Text summary of comparison for job match

    private LocalDateTime analyzedAt;

    @PrePersist
    protected void onCreate() {
        analyzedAt = LocalDateTime.now();
    }
}
