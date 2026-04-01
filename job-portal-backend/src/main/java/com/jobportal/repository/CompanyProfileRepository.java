package com.jobportal.repository;

import com.jobportal.entity.CompanyProfile;
import com.jobportal.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CompanyProfileRepository extends JpaRepository<CompanyProfile, Long> {

    Optional<CompanyProfile> findByUser(User user);
    
    void deleteByUser(User user);
}
