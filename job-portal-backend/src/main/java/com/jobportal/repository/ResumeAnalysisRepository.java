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

    // Get the latest specific match analysis with eager loading for DTO conversion
    @Query("SELECT ra FROM ResumeAnalysis ra " +
           "JOIN FETCH ra.job j " +
           "JOIN FETCH j.employer e " +
           "LEFT JOIN FETCH e.companyProfile cp " +
           "WHERE ra.resume = :resume AND ra.job = :job " +
           "ORDER BY ra.analyzedAt DESC")
    List<ResumeAnalysis> findTopByResumeAndJobOrderByAnalyzedAtDesc(@Param("resume") Resume resume, @Param("job") Job job);

    // Get all analyses for a specific job
    List<ResumeAnalysis> findByJob(Job job);

    // Delete all analyses for a user
    void deleteByUserId(Long userId);

    // Check if a resume has any analysis linked to a job posted by an employer
    @Query("SELECT COUNT(ra) > 0 FROM ResumeAnalysis ra WHERE ra.resume.id = :resumeId AND ra.job.employer.id = :employerId")
    boolean existsByResumeIdAndJobEmployerId(@Param("resumeId") Long resumeId, @Param("employerId") Long employerId);
}
