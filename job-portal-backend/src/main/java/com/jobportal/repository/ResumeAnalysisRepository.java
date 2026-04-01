package com.jobportal.repository;

import com.jobportal.entity.ResumeAnalysis;
import com.jobportal.entity.User;
import com.jobportal.entity.Resume;
import com.jobportal.entity.Job;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ResumeAnalysisRepository extends JpaRepository<ResumeAnalysis, Long> {
    
    // Get all analyses for a user
    List<ResumeAnalysis> findByUserIdOrderByAnalyzedAtDesc(Long userId);

    // Get analyses for a specific resume
    List<ResumeAnalysis> findByResumeOrderByAnalyzedAtDesc(Resume resume);

    // Get a specific match analysis
    Optional<ResumeAnalysis> findByResumeAndJob(Resume resume, Job job);

    // Get all analyses for a specific job
    List<ResumeAnalysis> findByJob(Job job);

    // Delete all analyses for a user
    void deleteByUserId(Long userId);
}
