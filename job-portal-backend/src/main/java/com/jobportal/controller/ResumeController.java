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
import jakarta.servlet.http.HttpServletRequest;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.util.List;
import java.util.Map;
import java.util.UUID;
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

    @Value("${app.resume.upload-dir}")
    private String uploadDir;

    /**
     * POST /api/resume/upload?name=My Resume
     */
    @PostMapping("/upload")
    public ResponseEntity<?> uploadResume(
            @RequestParam(defaultValue = "My Resume") String name,
            @RequestParam("file") MultipartFile file,
            HttpServletRequest request) {

        Long userId = securityUtil.getCurrentUserId(request);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (file.isEmpty()) {
            throw new CustomException("Please select a file", HttpStatus.BAD_REQUEST);
        }
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !originalFilename.toLowerCase().endsWith(".pdf")) {
            throw new CustomException("Only PDF files are allowed", HttpStatus.BAD_REQUEST);
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.equals("application/pdf")) {
            throw new CustomException("Invalid file content type. Only PDF files are allowed", HttpStatus.BAD_REQUEST);
        }
        if (file.getSize() > 10 * 1024 * 1024) {
            throw new CustomException("File size must be less than 10MB", HttpStatus.BAD_REQUEST);
        }

        if (resumeRepository.countByUser(user) >= 5) {
            throw new CustomException("Maximum 5 resumes allowed. Please delete one first.", HttpStatus.BAD_REQUEST);
        }

        try {
            log.info("Upload dir: {}", uploadDir);
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath();
            log.info("Upload path resolved to: {}", uploadPath.toAbsolutePath());
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
                log.info("Created upload directory: {}", uploadPath.toAbsolutePath());
            }

            String fileName = "resume_" + userId + "_" + UUID.randomUUID() + ".pdf";
            Path filePath = uploadPath.resolve(fileName);
            log.info("Saving file to: {}", filePath.toAbsolutePath());
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            log.info("File saved successfully");

            Resume resume = Resume.builder()
                    .user(user)
                    .name(name)
                    .fileName(fileName)
                    .build();

            log.info("Saving resume record to DB...");
            Resume saved = resumeRepository.save(resume);
            log.info("Resume saved to DB with id {}", saved.getId());

            ResumeDTO dto = ResumeDTO.from(saved);
            log.info("Returning DTO: id={}, name={}", dto.id, dto.name);
            return ResponseEntity.status(HttpStatus.CREATED).body(dto);

        } catch (Exception e) {
            log.error("Failed to upload resume - {}: {}", e.getClass().getName(), e.getMessage(), e);
            throw new CustomException("Failed to upload resume: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * POST /api/resume/upload/with-user?userId=123&name=My Resume
     */
    @PostMapping("/upload/with-user")
    public ResponseEntity<?> uploadResumeWithUserId(
            @RequestParam Long userId,
            @RequestParam(defaultValue = "My Resume") String name,
            @RequestParam("file") MultipartFile file) {
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (file.isEmpty()) {
            throw new CustomException("Please select a file", HttpStatus.BAD_REQUEST);
        }
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !originalFilename.toLowerCase().endsWith(".pdf")) {
            throw new CustomException("Only PDF files are allowed", HttpStatus.BAD_REQUEST);
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.equals("application/pdf")) {
            throw new CustomException("Invalid file content type. Only PDF files are allowed", HttpStatus.BAD_REQUEST);
        }
        if (file.getSize() > 10 * 1024 * 1024) {
            throw new CustomException("File size must be less than 10MB", HttpStatus.BAD_REQUEST);
        }

        if (resumeRepository.countByUser(user) >= 5) {
            throw new CustomException("Maximum 5 resumes allowed. Please delete one first.", HttpStatus.BAD_REQUEST);
        }

        try {
            String fileName = "resume_" + userId + "_" + UUID.randomUUID() + ".pdf";
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath();
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            Path filePath = uploadPath.resolve(fileName);
            log.info("Saving file to: {}", filePath.toAbsolutePath());
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            log.info("File saved successfully");

            Resume resume = Resume.builder()
                    .user(user)
                    .name(name)
                    .fileName(fileName)
                    .build();

            log.info("Saving resume record to DB...");
            Resume saved = resumeRepository.save(resume);
            log.info("Resume saved to DB with id {}", saved.getId());

            ResumeDTO dto = ResumeDTO.from(saved);
            return ResponseEntity.status(HttpStatus.CREATED).body(dto);

        } catch (Exception e) {
            log.error("Failed to upload resume - {}: {}", e.getClass().getName(), e.getMessage(), e);
            throw new CustomException("Failed to upload resume: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * GET /api/resume/list
     */
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

    /**
     * GET /api/resume/check
     */
    @GetMapping("/check")
    public ResponseEntity<Map<String, Object>> checkResumes(HttpServletRequest request) {
        Long userId = securityUtil.getCurrentUserId(request);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        List<Resume> resumes = resumeRepository.findByUserOrderByCreatedAtDesc(user);
        boolean hasResume = !resumes.isEmpty();
        Long resumeId = hasResume ? resumes.get(0).getId() : null;
        return ResponseEntity.ok(Map.of(
                "hasResume", hasResume,
                "count", resumes.size(),
                "resumeId", resumeId != null ? resumeId : 0L
        ));
    }

    /**
     * GET /api/resume/preview/{resumeId}?token=xxx
     */
    @GetMapping("/preview/{resumeId}")
    public ResponseEntity<Resource> previewResume(@PathVariable Long resumeId,
                                                   @RequestParam(required = false) String token,
                                                   HttpServletRequest request) {
        Resume resume = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new ResourceNotFoundException("Resume", "id", resumeId));

        Long currentUserId;
        if (token != null && !token.isEmpty()) {
            currentUserId = securityUtil.getUserIdFromToken(token);
        } else {
            currentUserId = securityUtil.getCurrentUserId(request);
        }

        boolean isOwner = resume.getUser().getId().equals(currentUserId);
        boolean isEmployer = false;
        if (!isOwner) {
            isEmployer = jobApplicationRepository.existsByResumeAndJobEmployer(resume, currentUserId);
        }
        if (!isOwner && !isEmployer) {
            throw new CustomException("Access denied", HttpStatus.FORBIDDEN);
        }

        try {
            Path filePath = Paths.get(uploadDir).toAbsolutePath().resolve(resume.getFileName()).normalize();
            if (!filePath.startsWith(Paths.get(uploadDir).toAbsolutePath().normalize())) {
                throw new CustomException("Invalid file path", HttpStatus.BAD_REQUEST);
            }
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                throw new CustomException("Resume file not found", HttpStatus.NOT_FOUND);
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "inline; filename=\"" + resume.getName().replaceAll(" ", "_") + ".pdf\"")
                    .body(resource);

        } catch (MalformedURLException e) {
            throw new CustomException("Failed to preview resume", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * GET /api/resume/download/{resumeId}
     */
    @GetMapping("/download/{resumeId}")
    public ResponseEntity<Resource> downloadResume(@PathVariable Long resumeId, HttpServletRequest request) {
        Resume resume = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new ResourceNotFoundException("Resume", "id", resumeId));

        Long currentUserId = securityUtil.getCurrentUserId(request);

        boolean isOwner = resume.getUser().getId().equals(currentUserId);
        boolean isEmployer = false;
        if (!isOwner) {
            isEmployer = jobApplicationRepository.existsByResumeAndJobEmployer(resume, currentUserId);
        }
        if (!isOwner && !isEmployer) {
            throw new CustomException("Access denied", HttpStatus.FORBIDDEN);
        }

        try {
            Path filePath = Paths.get(uploadDir).toAbsolutePath().resolve(resume.getFileName()).normalize();
            if (!filePath.startsWith(Paths.get(uploadDir).toAbsolutePath().normalize())) {
                throw new CustomException("Invalid file path", HttpStatus.BAD_REQUEST);
            }
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                throw new CustomException("Resume file not found", HttpStatus.NOT_FOUND);
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + resume.getName().replaceAll(" ", "_") + ".pdf\"")
                    .body(resource);

        } catch (MalformedURLException e) {
            throw new CustomException("Failed to download resume", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * DELETE /api/resume/delete/{resumeId}
     */
    @DeleteMapping("/delete/{resumeId}")
    @Transactional
    public ResponseEntity<?> deleteResume(@PathVariable Long resumeId, HttpServletRequest request) {
        Resume resume = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new ResourceNotFoundException("Resume", "id", resumeId));

        Long currentUserId = securityUtil.getCurrentUserId(request);
        if (!resume.getUser().getId().equals(currentUserId)) {
            throw new CustomException("Access denied", HttpStatus.FORBIDDEN);
        }

        try {
            jobApplicationRepository.clearResumeFromApplication(resume);

            resumeAnalysisRepository.deleteAll(resumeAnalysisRepository.findByResumeOrderByAnalyzedAtDesc(resume));

            Path filePath = Paths.get(uploadDir).toAbsolutePath().resolve(resume.getFileName());
            Files.deleteIfExists(filePath);
            resumeRepository.delete(resume);
            return ResponseEntity.ok(Map.of("message", "Resume deleted successfully"));
        } catch (IOException e) {
            throw new CustomException("Failed to delete resume", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * PUT /api/resume/rename/{resumeId}?name=New Name
     */
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
