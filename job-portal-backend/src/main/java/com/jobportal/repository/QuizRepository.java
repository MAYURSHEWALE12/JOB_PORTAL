package com.jobportal.repository;

import com.jobportal.entity.Quiz;
import com.jobportal.entity.Job;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, Long> {
    Optional<Quiz> findByJob(Job job);
    Optional<Quiz> findByJobId(Long jobId);
}
