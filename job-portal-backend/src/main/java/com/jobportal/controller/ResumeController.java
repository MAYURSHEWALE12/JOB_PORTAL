package com.jobportal.controller;

import com.jobportal.dto.ResumeDTO;
import com.jobportal.entity.Resume;
import com.jobportal.entity.User;
import com.jobportal.exception.CustomException;
import com.jobportal.exception.ResourceNotFoundException;
import com.jobportal.repository.JobApplicationRepository;
import com.jobportal.repository.ResumeAnalysisRepository;
import com.jobportal.repository.ResumeRepository;
import com.jobportal.repository.UserRepository;
import com.jobportal.security.SecurityUtil;
import com.jobportal.service.CloudinaryService;
import jakarta.servlet.http.HttpServletRequest;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/resume")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Resumes", description = "Resume upload, preview, download, and management")
public class ResumeController {

    private final ResumeRepository resumeRepository;
    private final UserRepository userRepository;
    private final ResumeAnalysisRepository resumeAnalysisRepository;
    private final JobApplicationRepository jobApplicationRepository;
    private final SecurityUtil securityUtil;
    private final CloudinaryService cloudinaryService;

    /**
     * POST /api/resume/upload
     */
    @PostMapping("/upload")
    public ResponseEntity<?> uploadResume(
            @RequestParam(defaultValue = "My Resume") String name,
            @RequestParam("file") MultipartFile file,
            HttpServletRequest request) {

        Long userId = securityUtil.getCurrentUserId(request);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        validateFile(file);

        if (resumeRepository.countByUser(user) >= 5) {
            throw new CustomException("Maximum 5 resumes allowed. Please delete one first.", HttpStatus.BAD_REQUEST);
        }

        try {
            Map result = cloudinaryService.uploadFile(file, "resumes");
            String fileUrl = (String) result.get("secure_url");

            Resume resume = Resume.builder()
                    .user(user)
                    .name(name)
                    .fileName(fileUrl)
                    .build();

            Resume saved = resumeRepository.save(resume);
            return ResponseEntity.status(HttpStatus.CREATED).body(ResumeDTO.from(saved));

        } catch (Exception e) {
            log.error("Cloudinary upload failed", e);
            throw new CustomException("Failed to upload resume to cloud: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * POST /api/resume/upload/with-user
     */
    @PostMapping("/upload/with-user")
    public ResponseEntity<?> uploadResumeWithUserId(
            @RequestParam Long userId,
            @RequestParam(defaultValue = "My Resume") String name,
            @RequestParam("file") MultipartFile file) {
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        validateFile(file);

        if (resumeRepository.countByUser(user) >= 5) {
            throw new CustomException("Maximum 5 resumes allowed.", HttpStatus.BAD_REQUEST);
        }

        try {
            Map result = cloudinaryService.uploadFile(file, "resumes");
            String fileUrl = (String) result.get("secure_url");

            Resume resume = Resume.builder()
                    .user(user)
                    .name(name)
                    .fileName(fileUrl)
                    .build();

            Resume saved = resumeRepository.save(resume);
            return ResponseEntity.status(HttpStatus.CREATED).body(ResumeDTO.from(saved));

        } catch (Exception e) {
            throw new CustomException("Cloud upload failed: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new CustomException("Please select a file", HttpStatus.BAD_REQUEST);
        }
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !originalFilename.toLowerCase().endsWith(".pdf")) {
            throw new CustomException("Only PDF files are allowed", HttpStatus.BAD_REQUEST);
        }
        if (file.getSize() > 10 * 1024 * 1024) {
            throw new CustomException("File size must be less than 10MB", HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/list")
    public ResponseEntity<List<ResumeDTO>> getResumes(HttpServletRequest request) {
        Long userId = securityUtil.getCurrentUserId(request);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        List<ResumeDTO> dtos = resumeRepository.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(ResumeDTO::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/check")
    public ResponseEntity<Map<String, Object>> checkResumes(HttpServletRequest request) {
        Long userId = securityUtil.getCurrentUserId(request);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        List<Resume> resumes = resumeRepository.findByUserOrderByCreatedAtDesc(user);
        boolean hasResume = !resumes.isEmpty();
        return ResponseEntity.ok(Map.of(
                "hasResume", hasResume,
                "count", resumes.size(),
                "resumeId", hasResume ? resumes.get(0).getId() : 0L
        ));
    }

    @GetMapping("/preview/{resumeId}")
    public ResponseEntity<Resource> previewResume(@PathVariable Long resumeId,
                                                   @RequestParam(required = false) String token,
                                                   HttpServletRequest request) {
        Resume resume = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new ResourceNotFoundException("Resume", "id", resumeId));

        Long currentUserId = (token != null && !token.isEmpty()) ? securityUtil.getUserIdFromToken(token) : securityUtil.getCurrentUserId(request);

        boolean isOwner = resume.getUser().getId().equals(currentUserId);
        boolean isEmployer = isOwner || jobApplicationRepository.existsByResumeAndJobEmployer(resume, currentUserId);
        
        if (!isOwner && !isEmployer) {
            throw new CustomException("Access denied", HttpStatus.FORBIDDEN);
        }

        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(resume.getFileName()))
                .build();
    }

    @GetMapping("/url/{resumeId}")
    public ResponseEntity<Map<String, String>> getResumeUrl(@PathVariable Long resumeId, HttpServletRequest request) {
        Resume resume = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new ResourceNotFoundException("Resume", "id", resumeId));

        Long currentUserId = securityUtil.getCurrentUserId(request);

        boolean isOwner = resume.getUser().getId().equals(currentUserId);
        // Check if user is the candidate OR an employer who has received this resume via application
        boolean isEmployer = isOwner || jobApplicationRepository.existsByResumeAndJobEmployer(resume, currentUserId);
        
        if (!isOwner && !isEmployer) {
            throw new CustomException("Access denied: You do not have permission to view this blueprint.", HttpStatus.FORBIDDEN);
        }

        return ResponseEntity.ok(Map.of("url", resume.getFileName()));
    }

    @GetMapping("/download/{resumeId}")
    public ResponseEntity<Resource> downloadResume(@PathVariable Long resumeId, HttpServletRequest request) {
        return previewResume(resumeId, null, request);
    }

    @DeleteMapping("/delete/{resumeId}")
    @Transactional
    public ResponseEntity<?> deleteResume(@PathVariable Long resumeId, HttpServletRequest request) {
        Resume resume = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new ResourceNotFoundException("Resume", "id", resumeId));

        Long currentUserId = securityUtil.getCurrentUserId(request);
        if (!resume.getUser().getId().equals(currentUserId)) {
            throw new CustomException("Access denied", HttpStatus.FORBIDDEN);
        }

        jobApplicationRepository.clearResumeFromApplication(resume);
        resumeAnalysisRepository.deleteAll(resumeAnalysisRepository.findByResumeOrderByAnalyzedAtDesc(resume));
        resumeRepository.delete(resume);
        
        // Note: For now we don't delete from Cloudinary to keep it simple, 
        // as we only store the URL and not the public_id for easy deletion.
        
        return ResponseEntity.ok(Map.of("message", "Resume deleted successfully"));
    }

    @PutMapping("/rename/{resumeId}")
    public ResponseEntity<ResumeDTO> renameResume(
            @PathVariable Long resumeId,
            @RequestParam String name,
            HttpServletRequest request) {
        Resume resume = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new ResourceNotFoundException("Resume", "id", resumeId));

        Long currentUserId = securityUtil.getCurrentUserId(request);
        if (!resume.getUser().getId().equals(currentUserId)) {
            throw new CustomException("Access denied", HttpStatus.FORBIDDEN);
        }

        resume.setName(name);
        return ResponseEntity.ok(ResumeDTO.from(resumeRepository.save(resume)));
    }
}
