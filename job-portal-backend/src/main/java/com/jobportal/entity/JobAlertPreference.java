package com.jobportal.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Entity
@Table(name = "job_alert_preferences")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobAlertPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JsonIgnore
    private User user;

    @Column(nullable = false)
    private String keywords;

    private String location;

    private String jobType;

    @Column(name = "salary_min")
    private Long salaryMin;

    @Column(name = "email_enabled")
    private Boolean emailEnabled;

    @Column(name = "in_app_enabled")
    private Boolean inAppEnabled;

    @Column(name = "is_active")
    private Boolean isActive;
}
