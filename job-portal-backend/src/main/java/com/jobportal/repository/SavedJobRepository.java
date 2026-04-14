package com.jobportal.repository;

import com.jobportal.entity.Job;
import com.jobportal.entity.SavedJob;
import com.jobportal.entity.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SavedJobRepository extends JpaRepository<SavedJob, Long> {

    @EntityGraph(attributePaths = {"job", "job.employer"})
    List<SavedJob> findByUser(User user);

    @EntityGraph(attributePaths = {"job", "job.employer"})
    List<SavedJob> findByJob(Job job);

    boolean existsByUserAndJob(User user, Job job);

    @EntityGraph(attributePaths = {"job", "job.employer"})
    Optional<SavedJob> findByUserAndJob(User user, Job job);

    void deleteByUserAndJob(User user, Job job);

    void deleteByUser(User user);
}