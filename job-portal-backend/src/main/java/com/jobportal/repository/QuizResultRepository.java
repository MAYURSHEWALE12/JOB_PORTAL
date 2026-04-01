package com.jobportal.repository;

import com.jobportal.entity.QuizResult;
import com.jobportal.entity.JobApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface QuizResultRepository extends JpaRepository<QuizResult, Long> {
    Optional<QuizResult> findByApplication(JobApplication application);
    Optional<QuizResult> findByApplicationId(Long applicationId);

    // Delete all quiz results for a user's applications
    @org.springframework.data.jpa.repository.Query("DELETE FROM QuizResult qr WHERE qr.application.jobSeeker.id = :userId")
    @org.springframework.data.jpa.repository.Modifying
    void deleteByApplicationJobSeekerId(@org.springframework.data.repository.query.Param("userId") Long userId);
}
