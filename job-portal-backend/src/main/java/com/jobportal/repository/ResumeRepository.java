package com.jobportal.repository;

import com.jobportal.entity.Resume;
import com.jobportal.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResumeRepository extends JpaRepository<Resume, Long> {

    // Get all resumes by user
    List<Resume> findByUserOrderByCreatedAtDesc(User user);

    // Count resumes by user
    long countByUser(User user);

    // Delete all resumes by user
    void deleteByUser(User user);
}