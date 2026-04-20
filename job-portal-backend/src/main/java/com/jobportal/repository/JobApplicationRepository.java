package com.jobportal.repository;

import com.jobportal.entity.JobApplication;
import com.jobportal.entity.ApplicationStatus;
import com.jobportal.entity.User;
import com.jobportal.entity.Job;
import org.springframework.data.jpa.repository.EntityGraph;
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

    @Query("SELECT a FROM JobApplication a LEFT JOIN FETCH a.job j LEFT JOIN FETCH j.employer LEFT JOIN FETCH a.jobSeeker LEFT JOIN FETCH a.selectedResume WHERE a.jobSeeker = :jobSeeker")
    List<JobApplication> findByJobSeeker(User jobSeeker);

    @Query(value = "SELECT a FROM JobApplication a LEFT JOIN FETCH a.job j LEFT JOIN FETCH j.employer LEFT JOIN FETCH a.jobSeeker LEFT JOIN FETCH a.selectedResume WHERE a.jobSeeker = :jobSeeker",
           countQuery = "SELECT COUNT(a) FROM JobApplication a WHERE a.jobSeeker = :jobSeeker")
    Page<JobApplication> findByJobSeeker(@Param("jobSeeker") User jobSeeker, Pageable pageable);

    @Query("SELECT a FROM JobApplication a LEFT JOIN FETCH a.job j LEFT JOIN FETCH j.employer LEFT JOIN FETCH a.jobSeeker LEFT JOIN FETCH a.selectedResume WHERE a.job = :job")
    List<JobApplication> findByJob(Job job);

    @Query(value = "SELECT a FROM JobApplication a LEFT JOIN FETCH a.job j LEFT JOIN FETCH j.employer LEFT JOIN FETCH a.jobSeeker LEFT JOIN FETCH a.selectedResume WHERE a.job = :job",
           countQuery = "SELECT COUNT(a) FROM JobApplication a WHERE a.job = :job")
    Page<JobApplication> findByJob(@Param("job") Job job, Pageable pageable);

    @Query("SELECT a FROM JobApplication a LEFT JOIN FETCH a.job j LEFT JOIN FETCH j.employer LEFT JOIN FETCH a.jobSeeker LEFT JOIN FETCH a.selectedResume WHERE j.employer = :employer")
    List<JobApplication> findByJobEmployer(User employer);

    @Query(value = "SELECT a FROM JobApplication a LEFT JOIN FETCH a.job j LEFT JOIN FETCH j.employer LEFT JOIN FETCH a.jobSeeker LEFT JOIN FETCH a.selectedResume WHERE j.employer = :employer",
           countQuery = "SELECT COUNT(a) FROM JobApplication a JOIN a.job j WHERE j.employer = :employer")
    Page<JobApplication> findByJobEmployer(@Param("employer") User employer, Pageable pageable);

    @Query("SELECT a FROM JobApplication a LEFT JOIN FETCH a.job j LEFT JOIN FETCH j.employer LEFT JOIN FETCH a.jobSeeker LEFT JOIN FETCH a.selectedResume WHERE a.job = :job AND a.jobSeeker = :jobSeeker")
    Optional<JobApplication> findByJobAndJobSeeker(Job job, User jobSeeker);

    boolean existsByJobAndJobSeeker(Job job, User jobSeeker);
    boolean existsByJobAndJobSeekerAndStatusNot(Job job, User jobSeeker, ApplicationStatus status);
    
    @Query("SELECT COUNT(a) > 0 FROM JobApplication a WHERE (a.jobSeeker = :u1 AND a.job.employer = :u2) OR (a.jobSeeker = :u2 AND a.job.employer = :u1)")
    boolean existsRelationship(@Param("u1") User u1, @Param("u2") User u2);

    @Query("SELECT a FROM JobApplication a LEFT JOIN FETCH a.job j LEFT JOIN FETCH j.employer LEFT JOIN FETCH a.jobSeeker LEFT JOIN FETCH a.selectedResume WHERE a.jobSeeker = :jobSeeker AND a.status = :status")
    List<JobApplication> findByJobSeekerAndStatus(User jobSeeker, ApplicationStatus status);

    @Query(value = "SELECT a FROM JobApplication a LEFT JOIN FETCH a.job j LEFT JOIN FETCH j.employer LEFT JOIN FETCH a.jobSeeker LEFT JOIN FETCH a.selectedResume WHERE a.jobSeeker = :jobSeeker AND a.status = :status",
           countQuery = "SELECT COUNT(a) FROM JobApplication a WHERE a.jobSeeker = :jobSeeker AND a.status = :status")
    Page<JobApplication> findByJobSeekerAndStatus(@Param("jobSeeker") User jobSeeker, @Param("status") ApplicationStatus status, Pageable pageable);

    void deleteByJobSeeker(User jobSeeker);

    void deleteByJob(Job job);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Transactional
    @Query("UPDATE JobApplication a SET a.selectedResume = null WHERE a.selectedResume = :resume")
    void clearResumeFromApplication(@Param("resume") com.jobportal.entity.Resume resume);

    @Query("SELECT COUNT(a) > 0 FROM JobApplication a WHERE a.selectedResume = :resume AND a.job.employer.id = :employerId")
    boolean existsByResumeAndJobEmployer(@Param("resume") com.jobportal.entity.Resume resume, @Param("employerId") Long employerId);

    @Query("SELECT a FROM JobApplication a JOIN FETCH a.job j JOIN FETCH j.employer JOIN FETCH a.jobSeeker WHERE a.id = :id")
    Optional<JobApplication> findByIdWithDetails(@Param("id") Long id);
}