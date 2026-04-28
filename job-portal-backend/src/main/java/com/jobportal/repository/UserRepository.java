package com.jobportal.repository;

import com.jobportal.entity.User;
import com.jobportal.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
/**
 * Repository interface for User entity
 * Provides database operations for User
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Find user by email
     *
     * @param email User email
     * @return Optional containing user if found
     */
    Optional<User> findByEmail(String email);
    Optional<User> findByResetToken(String resetToken);

    /**
     * Find all users by role
     *
     * @param role User role
     * @return List of users with specified role
     */
    List<User> findByRole(UserRole role);

    long countByRole(UserRole role);

    /**
     * Check if user exists by email
     *
     * @param email User email
     * @return true if user exists, false otherwise
     */
    boolean existsByEmail(String email);

    @Query("SELECT u FROM User u WHERE LOWER(u.firstName) LIKE LOWER(CONCAT('%', :name, '%')) OR LOWER(u.lastName) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<User> searchByName(@Param("name") String name);

    /**
     * Find all users that the current user is allowed to message.
     * Logic:
     * - Admins are always messageable
     * - Existing conversation partners are always messageable
     * - Employers/JobSeekers with an active job application relationship are messageable
     */
    @Query("SELECT DISTINCT u FROM User u WHERE " +
           "u.id <> :currId AND (" +
           "u.role = com.jobportal.entity.UserRole.ADMIN OR " +
           "u.id IN (SELECT m.sender.id FROM Message m WHERE m.receiver.id = :currId) OR " +
           "u.id IN (SELECT m.receiver.id FROM Message m WHERE m.sender.id = :currId) OR " +
           "u.id IN (SELECT a.job.employer.id FROM JobApplication a WHERE a.jobSeeker.id = :currId) OR " +
           "u.id IN (SELECT a.jobSeeker.id FROM JobApplication a WHERE a.job.employer.id = :currId)" +
           ")")
    List<User> findConnectableUsers(@Param("currId") Long currId);

    @Query("SELECT u FROM User u WHERE u.id <> :userId")
    List<User> findAllExcept(@Param("userId") Long userId);
}
