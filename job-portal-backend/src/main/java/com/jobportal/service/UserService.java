package com.jobportal.service;

import com.jobportal.entity.User;
import com.jobportal.entity.UserRole;
import com.jobportal.entity.Interview;
import com.jobportal.repository.*;
import com.jobportal.dto.UserDTO;
import com.jobportal.exception.ResourceNotFoundException;
import com.jobportal.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
// Change this import
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service class for User management operations
 * Handles user registration, authentication, profile management, and other user-related operations
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UserService {

    private final UserRepository userRepository;
    // CHANGE: Use PasswordEncoder interface to match the @Bean in SecurityConfig
    private final PasswordEncoder passwordEncoder;
    private final ResumeRepository resumeRepository;
    private final MessageRepository messageRepository;
    private final SavedJobRepository savedJobRepository;
    private final NotificationRepository notificationRepository;
    private final JobAlertPreferenceRepository jobAlertPreferenceRepository;
    private final ResumeAnalysisRepository resumeAnalysisRepository;
    private final JobApplicationRepository jobApplicationRepository;
    private final QuizResultRepository quizResultRepository;
    private final CompanyProfileRepository companyProfileRepository;
    private final JobRepository jobRepository;
    private final InterviewRepository interviewRepository;
    private final CloudinaryService cloudinaryService;

    // ==================== REGISTRATION & AUTHENTICATION ====================

    /**
     * Register a new user
     * @param user User entity with registration details
     * @return Created User
     * @throws BadRequestException if email already exists
     */
    public User registerUser(User user) {
        log.info("Registering new user with email: {}", user.getEmail());

        // Check if email already exists
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            log.warn("User registration failed: Email {} already exists", user.getEmail());
            throw new BadRequestException("Email already registered");
        }

        // Validate required fields
        if (user.getEmail() == null || user.getEmail().isEmpty()) {
            throw new BadRequestException("Email is required");
        }
        if (user.getPassword() == null || user.getPassword().isEmpty()) {
            throw new BadRequestException("Password is required");
        }
        if (user.getFirstName() == null || user.getFirstName().isEmpty()) {
            throw new BadRequestException("First name is required");
        }
        if (user.getLastName() == null || user.getLastName().isEmpty()) {
            throw new BadRequestException("Last name is required");
        }

        // Hash password before saving
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        // Set default role if not specified
        if (user.getRole() == null) {
            user.setRole(UserRole.JOBSEEKER);
        }

        // Save to database
        User savedUser = userRepository.save(user);
        log.info("User registered successfully with ID: {}", savedUser.getId());

        return savedUser;
    }

    /**
     * Verify user credentials
     * @param email User email
     * @param password User password (plain text)
     * @return true if credentials are valid, false otherwise
     */
    public boolean verifyCredentials(String email, String password) {
        log.debug("Verifying credentials for user: {}", email);

        Optional<User> user = userRepository.findByEmail(email);

        if (user.isEmpty()) {
            log.warn("User not found: {}", email);
            return false;
        }

        // Compare plain text password with hashed password
        boolean isValid = passwordEncoder.matches(password, user.get().getPassword());

        if (isValid) {
            log.info("Credentials verified successfully for user: {}", email);
        } else {
            log.warn("Invalid password for user: {}", email);
        }

        return isValid;
    }

    // ==================== USER RETRIEVAL ====================

    /**
     * Get user by ID
     * @param id User ID
     * @return User object
     * @throws ResourceNotFoundException if user not found
     */
    @Transactional(readOnly = true)
    public User getUserById(Long id) {
        log.debug("Fetching user with ID: {}", id);

        return userRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("User not found with ID: {}", id);
                    // Corrected: Three arguments required
                    return new ResourceNotFoundException("User", "id", id);
                });
    }

    /**
     * Get user by email
     * @param email User email
     * @return User object
     * @throws ResourceNotFoundException if user not found
     */
    @Transactional(readOnly = true)
    public User getUserByEmail(String email) {
        log.debug("Fetching user with email: {}", email);

        return userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    log.warn("User not found with email: {}", email);
                    // Corrected: Three arguments required
                    return new ResourceNotFoundException("User", "email", email);
                });
    }

    /**
     * Find user by email (returns Optional)
     * @param email User email
     * @return Optional containing user if found
     */
    @Transactional(readOnly = true)
    public Optional<User> findByEmail(String email) {
        log.debug("Searching for user with email: {}", email);
        return userRepository.findByEmail(email);
    }

    /**
     * Get all users (Admin only)
     * @return List of all users
     */
    @Transactional(readOnly = true)
    public List<User> getAllUsers() {
        log.debug("Fetching all users");
        return userRepository.findAll();
    }

    /**
     * Get all job seekers
     * @return List of job seekers
     */
    @Transactional(readOnly = true)
    public List<User> getAllJobSeekers() {
        log.debug("Fetching all job seekers");
        return userRepository.findByRole(UserRole.JOBSEEKER);
    }

    /**
     * Get all employers
     * @return List of employers
     */
    @Transactional(readOnly = true)
    public List<User> getAllEmployers() {
        log.debug("Fetching all employers");
        return userRepository.findByRole(UserRole.EMPLOYER);
    }

    /**
     * Get all admins
     * @return List of admins
     */
    @Transactional(readOnly = true)
    public List<User> getAllAdmins() {
        log.debug("Fetching all admins");
        return userRepository.findByRole(UserRole.ADMIN);
    }

    // ==================== USER UPDATE ====================

    /**
     * Update user profile
     * @param id User ID
     * @param user Updated user details
     * @return Updated User object
     * @throws ResourceNotFoundException if user not found
     */
    public User updateUserProfile(Long id, User user) {
        log.info("Updating user profile for ID: {}", id);

        User existingUser = getUserById(id);

        // Update only allowed fields
        if (user.getFirstName() != null && !user.getFirstName().isEmpty()) {
            existingUser.setFirstName(user.getFirstName());
        }
        if (user.getLastName() != null && !user.getLastName().isEmpty()) {
            existingUser.setLastName(user.getLastName());
        }
        if (user.getPhone() != null && !user.getPhone().isEmpty()) {
            existingUser.setPhone(user.getPhone());
        }
        if (user.getProfileImageUrl() != null && !user.getProfileImageUrl().isEmpty()) {
            existingUser.setProfileImageUrl(user.getProfileImageUrl());
        }

        // Set update timestamp (automatically done by @UpdateTimestamp)
        existingUser.setUpdatedAt(LocalDateTime.now());

        User updatedUser = userRepository.save(existingUser);
        log.info("User profile updated successfully for ID: {}", id);

        return updatedUser;
    }

    /**
     * Update user profile image (Avatar)
     * @param id User ID
     * @param file Multipart file
     * @param uploadDir Directory to save the file
     * @return Updated User object
     */
    public User updateUserProfileImage(Long id, MultipartFile file, String uploadDir) {
        log.info("Uploading profile image to Cloudinary for user ID: {}", id);
        User user = getUserById(id);

        if (file.isEmpty()) {
            throw new BadRequestException("Please select a file to upload");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new BadRequestException("Only image files are allowed for profile pictures");
        }

        try {
            java.util.Map result = cloudinaryService.uploadFile(file, "avatars");
            String imageUrl = (String) result.get("secure_url");
            
            user.setProfileImageUrl(imageUrl);
            user.setUpdatedAt(LocalDateTime.now());

            User updatedUser = userRepository.save(user);
            log.info("Profile image updated in Cloudinary for user ID: {}", id);
            return updatedUser;

        } catch (IOException e) {
            log.error("Failed to upload profile image to Cloudinary for user ID: {}", id, e);
            throw new BadRequestException("Could not upload profile image: " + e.getMessage());
        }
    }

    /**
     * Change user password
     * @param id User ID
     * @param oldPassword Old password (plain text)
     * @param newPassword New password (plain text)
     * @throws ResourceNotFoundException if user not found
     * @throws BadRequestException if old password is incorrect
     */
    public void changePassword(Long id, String oldPassword, String newPassword) {
        log.info("Changing password for user ID: {}", id);

        User user = getUserById(id);

        // Verify old password
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            log.warn("Password change failed for user ID {}: Old password incorrect", id);
            throw new BadRequestException("Old password is incorrect");
        }

        // Validate new password
        if (newPassword == null || newPassword.isEmpty()) {
            throw new BadRequestException("New password cannot be empty");
        }

        if (newPassword.length() < 8) {
            throw new BadRequestException("New password must be at least 8 characters long");
        }

        // Encode and save new password
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        log.info("Password changed successfully for user ID: {}", id);
    }

    /**
     * Reset user password (Admin only)
     * @param id User ID
     * @param newPassword New password (plain text)
     * @throws ResourceNotFoundException if user not found
     */
    public void resetPassword(Long id, String newPassword) {
        log.info("Resetting password for user ID: {}", id);

        User user = getUserById(id);

        if (newPassword == null || newPassword.isEmpty()) {
            throw new BadRequestException("New password cannot be empty");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        log.info("Password reset successfully for user ID: {}", id);
    }

    /**
     * Update user role (Admin only)
     * @param id User ID
     * @param newRole New role
     * @throws ResourceNotFoundException if user not found
     */
    public User updateUserRole(Long id, UserRole newRole) {
        log.info("Updating role for user ID {} to: {}", id, newRole);

        User user = getUserById(id);
        user.setRole(newRole);
        user.setUpdatedAt(LocalDateTime.now());

        User updatedUser = userRepository.save(user);
        log.info("User role updated successfully for ID: {}", id);

        return updatedUser;
    }

    // ==================== USER DELETION ====================

    /**
     * Delete user account and all associated data
     * @param id User ID
     * @throws ResourceNotFoundException if user not found
     */
    @Transactional
    public void deleteUser(Long id) {
        log.info("Deleting user with ID: {}", id);

        User user = getUserById(id);

        // Delete dependent records in correct order to avoid FK violations
        resumeAnalysisRepository.deleteByUserId(id);
        resumeRepository.deleteByUser(user);
        jobAlertPreferenceRepository.deleteByUserId(id);
        notificationRepository.deleteByUserId(id);
        savedJobRepository.deleteByUser(user);
        messageRepository.deleteBySenderOrReceiver(user, user);
        // Delete interviews for applications before deleting the applications
        List<com.jobportal.entity.JobApplication> seekerApps = jobApplicationRepository.findByJobSeeker(user);
        for (com.jobportal.entity.JobApplication app : seekerApps) {
            interviewRepository.deleteAll(interviewRepository.findByApplication(app));
        }
        jobApplicationRepository.deleteByJobSeeker(user);
        quizResultRepository.deleteByApplicationJobSeekerId(id);
        companyProfileRepository.deleteByUser(user);

        // Delete employer's jobs (cascades to applications, quizzes, etc.)
        List<com.jobportal.entity.Job> employerJobs = jobRepository.findByEmployer(user);
        for (com.jobportal.entity.Job job : employerJobs) {
            // Delete interviews for applications before deleting applications
            List<com.jobportal.entity.JobApplication> jobApps = jobApplicationRepository.findByJob(job);
            for (com.jobportal.entity.JobApplication app : jobApps) {
                interviewRepository.deleteAll(interviewRepository.findByApplication(app));
            }
            jobApplicationRepository.deleteByJob(job);
        }
        jobRepository.deleteByEmployer(user);

        userRepository.deleteById(id);
        log.info("User deleted successfully with ID: {}", id);
    }

    /**
     * Soft delete user (deactivate account)
     * @param id User ID
     * @throws ResourceNotFoundException if user not found
     */
    public void deactivateUser(Long id) {
        log.info("Deactivating user with ID: {}", id);
        User user = getUserById(id);
        user.setRole(UserRole.JOBSEEKER);
        user.setPassword("DEACTIVATED_" + user.getPassword());
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
        log.info("User deactivated successfully with ID: {}", id);
    }

    // ==================== SEARCH & FILTER ====================

    /**
     * Search users by name (first name or last name)
     * @param name Search term
     * @return List of matching users
     */
    @Transactional(readOnly = true)
    public List<User> searchUsersByName(String name) {
        log.debug("Searching users with name: {}", name);
        return userRepository.searchByName(name);
    }

    /**
     * Get user count by role
     * @param role User role
     * @return Count of users with given role
     */
    @Transactional(readOnly = true)
    public long getUserCountByRole(UserRole role) {
        log.debug("Getting count of users with role: {}", role);

        return userRepository.findByRole(role).size();
    }

    /**
     * Get total user count
     * @return Total number of users
     */
    @Transactional(readOnly = true)
    public long getTotalUserCount() {
        log.debug("Getting total user count");
        return userRepository.count();
    }

    // ==================== USER PROFILE RETRIEVAL ====================

    /**
     * Get user profile as DTO
     * @param id User ID
     * @return UserDTO object
     */
    @Transactional(readOnly = true)
    public UserDTO getUserProfileDTO(Long id) {
        log.debug("Fetching user profile DTO for ID: {}", id);

        User user = getUserById(id);
        return convertToDTO(user);
    }

    /**
     * Get all users as DTOs
     * @return List of UserDTO objects
     */
    @Transactional(readOnly = true)
    public List<UserDTO> getAllUsersDTO() {
        log.debug("Fetching all users as DTOs");

        return userRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // ==================== HELPER METHODS ====================

    /**
     * Convert User entity to UserDTO
     * @param user User entity
     * @return UserDTO
     */
    private UserDTO convertToDTO(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phone(user.getPhone())
                .role(user.getRole())
                .profileImageUrl(user.getProfileImageUrl())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    /**
     * Check if email exists
     * @param email Email to check
     * @return true if email exists, false otherwise
     */
    @Transactional(readOnly = true)
    public boolean emailExists(String email) {
        log.debug("Checking if email exists: {}", email);
        return userRepository.findByEmail(email).isPresent();
    }

    @Transactional(readOnly = true)
    public boolean userExists(Long id) {
        log.debug("Checking if user exists with ID: {}", id);
        return userRepository.existsById(id);
    }
}