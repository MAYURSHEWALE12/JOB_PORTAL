package com.jobportal.controller;

import com.jobportal.dto.ResumeAnalysisDTO;
import com.jobportal.entity.Resume;
import com.jobportal.entity.Job;
import com.jobportal.entity.ResumeAnalysis;
import com.jobportal.exception.CustomException;
import com.jobportal.exception.ResourceNotFoundException;
import com.jobportal.repository.ResumeAnalysisRepository;
import com.jobportal.repository.ResumeRepository;
import com.jobportal.repository.JobRepository;
import com.jobportal.security.SecurityUtil;
import com.jobportal.service.ResumeAnalysisService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/resume-analysis")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Resume Analysis", description = "AI-powered ATS scoring and resume-job matching")
public class ResumeAnalysisController {

    private final ResumeAnalysisService analysisService;
    private final ResumeAnalysisRepository analysisRepository;
    private final ResumeRepository resumeRepository;
    private final JobRepository jobRepository;
    private final SecurityUtil securityUtil;

    /**
     * POST /api/resume-analysis/{resumeId}
     */
    @PostMapping("/{resumeId}")
    public ResponseEntity<ResumeAnalysisDTO> analyze(@PathVariable Long resumeId, HttpServletRequest request) {
        Long currentUserId = securityUtil.getCurrentUserId(request);
        Resume resume = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new ResourceNotFoundException("Resume", "id", resumeId));
        if (!resume.getUser().getId().equals(currentUserId)) {
            throw new CustomException("Access denied", HttpStatus.FORBIDDEN);
        }
        log.info("Analyzing resume {}", resumeId);
        return ResponseEntity.ok(ResumeAnalysisDTO.from(analysisService.analyzeResume(resumeId)));
    }

    /**
     * POST /api/resume-analysis/{resumeId}/match/{jobId}
     */
    @PostMapping("/{resumeId}/match/{jobId}")
    public ResponseEntity<ResumeAnalysisDTO> analyzeMatch(
            @PathVariable Long resumeId,
            @PathVariable Long jobId,
            HttpServletRequest request) {
        Long currentUserId = securityUtil.getCurrentUserId(request);
        Resume resume = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new ResourceNotFoundException("Resume", "id", resumeId));
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job", "id", jobId));

        boolean isResumeOwner = resume.getUser().getId().equals(currentUserId);
        boolean isJobOwner = job.getEmployer().getId().equals(currentUserId);

        if (!isResumeOwner && !isJobOwner) {
            throw new CustomException("Access denied", HttpStatus.FORBIDDEN);
        }
        log.info("Analyzing match for resume {} and job {}", resumeId, jobId);
        return ResponseEntity.ok(ResumeAnalysisDTO.from(analysisService.analyzeMatch(resumeId, jobId)));
    }

    @GetMapping("/match")
    public ResponseEntity<ResumeAnalysisDTO> getMatchAnalysis(@RequestParam Long resumeId, @RequestParam Long jobId,
                                                               HttpServletRequest request) {
        return getMatchAnalysisWithPath(resumeId, jobId, request);
    }

    @GetMapping("/{resumeId}/match/{jobId}")
    public ResponseEntity<ResumeAnalysisDTO> getMatchAnalysisWithPath(
            @PathVariable Long resumeId,
            @PathVariable Long jobId,
            HttpServletRequest request) {
        Long currentUserId = securityUtil.getCurrentUserId(request);
        Resume resume = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new ResourceNotFoundException("Resume", "id", resumeId));

        boolean isOwner = resume.getUser().getId().equals(currentUserId);
        boolean isEmployer = false;
        if (!isOwner) {
            Job job = jobRepository.findById(jobId).orElse(null);
            if (job != null && job.getEmployer() != null) {
                isEmployer = job.getEmployer().getId().equals(currentUserId);
            }
        }
        if (!isOwner && !isEmployer) {
            throw new CustomException("Access denied", HttpStatus.FORBIDDEN);
        }

        return analysisService.getMatchAnalysis(resumeId, jobId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    /**
     * GET /api/resume-analysis/user/{userId}
     * Service already returns DTOs (conversion happens inside @Transactional session)
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ResumeAnalysisDTO>> getHistory(@PathVariable Long userId, HttpServletRequest request) {
        Long currentUserId = securityUtil.getCurrentUserId(request);
        if (!currentUserId.equals(userId)) {
            throw new CustomException("Access denied", HttpStatus.FORBIDDEN);
        }
        return ResponseEntity.ok(analysisService.getHistory(userId));
    }
}
