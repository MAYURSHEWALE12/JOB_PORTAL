package com.jobportal.repository;

import com.jobportal.entity.JobApplication;
import com.jobportal.entity.ApplicationStatus;
import com.jobportal.entity.User;
import com.jobportal.entity.Job;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface JobApplicationRepository extends JpaRepository<JobApplication, Long> {

    // Get all applications by a jobseeker
    List<JobApplication> findByJobSeeker(User jobSeeker);
    Page<JobApplication> findByJobSeeker(User jobSeeker, Pageable pageable);

    List<JobApplication> findByJob(Job job);
    Page<JobApplication> findByJob(Job job, Pageable pageable);

    List<JobApplication> findByJobEmployer(User employer);
    Page<JobApplication> findByJobEmployer(User employer, Pageable pageable);

    Optional<JobApplication> findByJobAndJobSeeker(Job job, User jobSeeker);

    boolean existsByJobAndJobSeeker(Job job, User jobSeeker);

    List<JobApplication> findByJobSeekerAndStatus(User jobSeeker, ApplicationStatus status);
    Page<JobApplication> findByJobSeekerAndStatus(User jobSeeker, ApplicationStatus status, Pageable pageable);

    // Delete all applications by a jobseeker
    void deleteByJobSeeker(User jobSeeker);

    // Delete all applications for a job
    void deleteByJob(Job job);

    // Set resume reference to null for all applications using this resume
    @Modifying
    @Transactional
    @Query("UPDATE JobApplication a SET a.selectedResume = null WHERE a.selectedResume = :resume")
    void clearResumeFromApplication(@Param("resume") com.jobportal.entity.Resume resume);
}