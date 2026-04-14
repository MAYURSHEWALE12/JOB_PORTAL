package com.jobportal.repository;

import com.jobportal.entity.Job;
import com.jobportal.entity.JobStatus;
import com.jobportal.entity.JobType;
import com.jobportal.entity.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface JobRepository extends JpaRepository<Job, Long> {

    @EntityGraph(attributePaths = {"employer"})
    List<Job> findByStatus(JobStatus status);

    @EntityGraph(attributePaths = {"employer"})
    Page<Job> findByStatus(JobStatus status, Pageable pageable);

    long countByStatus(JobStatus status);

    @EntityGraph(attributePaths = {"employer"})
    List<Job> findByEmployer(User employer);

    @EntityGraph(attributePaths = {"employer"})
    Page<Job> findByEmployer(User employer, Pageable pageable);

    @EntityGraph(attributePaths = {"employer"})
    List<Job> findByEmployerAndStatus(User employer, JobStatus status);

    @EntityGraph(attributePaths = {"employer"})
    Page<Job> findByEmployerAndStatus(User employer, JobStatus status, Pageable pageable);

    @Query("SELECT j FROM Job j LEFT JOIN FETCH j.employer WHERE j.status = 'ACTIVE' AND (" +
            "LOWER(j.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(j.description) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(j.location) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<Job> searchByKeyword(@Param("keyword") String keyword);

    @Query("SELECT j FROM Job j LEFT JOIN FETCH j.employer WHERE j.status = 'ACTIVE' AND (" +
            "LOWER(j.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(j.description) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(j.location) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Job> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    @EntityGraph(attributePaths = {"employer"})
    List<Job> findByStatusAndJobType(JobStatus status, JobType jobType);

    @EntityGraph(attributePaths = {"employer"})
    Page<Job> findByStatusAndJobType(JobStatus status, JobType jobType, Pageable pageable);

    @Query("SELECT j FROM Job j LEFT JOIN FETCH j.employer WHERE j.status = 'ACTIVE' AND " +
            "LOWER(j.location) LIKE LOWER(CONCAT('%', :location, '%'))")
    List<Job> findByLocation(@Param("location") String location);

    @Query("SELECT j FROM Job j LEFT JOIN FETCH j.employer WHERE j.status = 'ACTIVE' AND " +
            "LOWER(j.location) LIKE LOWER(CONCAT('%', :location, '%'))")
    Page<Job> findByLocation(@Param("location") String location, Pageable pageable);

    @Query("SELECT j FROM Job j LEFT JOIN FETCH j.employer WHERE j.status = 'ACTIVE' AND " +
            "(:keyword IS NULL OR LOWER(j.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(j.description) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
            "(:location IS NULL OR LOWER(j.location) LIKE LOWER(CONCAT('%', :location, '%'))) AND " +
            "(:jobType IS NULL OR j.jobType = :jobType)")
    List<Job> searchJobs(
            @Param("keyword")  String keyword,
            @Param("location") String location,
            @Param("jobType")  JobType jobType
    );

    @Query("SELECT j FROM Job j LEFT JOIN FETCH j.employer WHERE j.status = 'ACTIVE' AND " +
            "(:keyword IS NULL OR LOWER(j.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(j.description) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
            "(:location IS NULL OR LOWER(j.location) LIKE LOWER(CONCAT('%', :location, '%'))) AND " +
            "(:jobType IS NULL OR j.jobType = :jobType)")
    Page<Job> searchJobs(
            @Param("keyword")  String keyword,
            @Param("location") String location,
            @Param("jobType")  JobType jobType,
            Pageable pageable
    );

    @Query("SELECT j FROM Job j LEFT JOIN FETCH j.employer WHERE j.status = 'ACTIVE' AND " +
            "(:keyword IS NULL OR LOWER(j.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(j.description) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
            "(:location IS NULL OR LOWER(j.location) LIKE LOWER(CONCAT('%', :location, '%'))) AND " +
            "(:jobType IS NULL OR j.jobType = :jobType) AND " +
            "(:salaryMin IS NULL OR j.salaryMax >= :salaryMin) AND " +
            "(:salaryMax IS NULL OR j.salaryMin <= :salaryMax) AND " +
            "(:experienceLevel IS NULL OR LOWER(j.experienceRequired) LIKE LOWER(CONCAT('%', :experienceLevel, '%'))) AND " +
            "(:educationLevel IS NULL OR LOWER(j.educationRequired) LIKE LOWER(CONCAT('%', :educationLevel, '%'))) AND " +
            "(:daysPosted IS NULL OR j.createdAt >= :sinceDate)")
    Page<Job> advancedSearch(
            @Param("keyword") String keyword,
            @Param("location") String location,
            @Param("jobType") JobType jobType,
            @Param("salaryMin") BigDecimal salaryMin,
            @Param("salaryMax") BigDecimal salaryMax,
            @Param("experienceLevel") String experienceLevel,
            @Param("educationLevel") String educationLevel,
            @Param("daysPosted") Integer daysPosted,
            @Param("sinceDate") LocalDateTime sinceDate,
            Pageable pageable
    );

    @Query("SELECT j FROM Job j LEFT JOIN FETCH j.employer WHERE j.status = 'ACTIVE' AND " +
            "j.id NOT IN :excludeJobIds AND " +
            "(:jobTypes IS NULL OR j.jobType IN :jobTypes) AND " +
            "(:location IS NULL OR LOWER(j.location) LIKE LOWER(CONCAT('%', :location, '%'))) AND " +
            "(:salaryMin IS NULL OR j.salaryMax >= :salaryMin) AND " +
            "(:salaryMax IS NULL OR j.salaryMin <= :salaryMax)")
    Page<Job> findRecommendedJobs(
            @Param("jobTypes") List<JobType> jobTypes,
            @Param("location") String location,
            @Param("salaryMin") BigDecimal salaryMin,
            @Param("salaryMax") BigDecimal salaryMax,
            @Param("excludeJobIds") List<Long> excludeJobIds,
            Pageable pageable
    );

    @Query("SELECT j FROM Job j WHERE j.status = 'ACTIVE' AND j.expiryDate IS NOT NULL AND j.expiryDate < :now")
    List<Job> findExpiredJobs(@Param("now") LocalDateTime now);

    @Modifying
    @Query("UPDATE Job j SET j.status = 'EXPIRED' WHERE j.status = 'ACTIVE' AND j.expiryDate IS NOT NULL AND j.expiryDate < :now")
    int expireJobs(@Param("now") LocalDateTime now);

    @Modifying
    @Query("UPDATE Job j SET j.viewCount = j.viewCount + 1 WHERE j.id = :jobId")
    int incrementViewCount(@Param("jobId") Long jobId);

    @Modifying
    @Query("UPDATE Job j SET j.applicationCount = j.applicationCount + 1 WHERE j.id = :jobId")
    int incrementApplicationCount(@Param("jobId") Long jobId);

    void deleteByEmployer(User employer);
}