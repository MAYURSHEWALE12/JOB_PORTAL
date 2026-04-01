package com.jobportal.repository;

import com.jobportal.entity.JobAlertPreference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobAlertPreferenceRepository extends JpaRepository<JobAlertPreference, Long> {
    List<JobAlertPreference> findByUserIdAndIsActiveTrue(Long userId);
    List<JobAlertPreference> findByIsActiveTrue();
    void deleteByUserId(Long userId);
}
