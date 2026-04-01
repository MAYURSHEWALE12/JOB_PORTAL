package com.jobportal.repository;

import com.jobportal.entity.Job;
import com.jobportal.entity.SavedJob;
import com.jobportal.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SavedJobRepository extends JpaRepository<SavedJob, Long> {

    // Get all saved jobs by user
    List<SavedJob> findByUser(User user);

    // Get all saved records for a specific job
    List<SavedJob> findByJob(Job job);

    // Check if already saved
    boolean existsByUserAndJob(User user, Job job);

    // Find specific saved job
    Optional<SavedJob> findByUserAndJob(User user, Job job);

    // Delete saved job
    void deleteByUserAndJob(User user, Job job);

    // Delete all saved jobs by user
    void deleteByUser(User user);
}