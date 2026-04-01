package com.jobportal.controller;

import com.jobportal.dto.ResumeAnalysisDTO;
import com.jobportal.service.ResumeAnalysisService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/resume-analysis")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class ResumeAnalysisController {

    private final ResumeAnalysisService analysisService;

    /**
     * POST /api/resume-analysis/{resumeId}
     */
    @PostMapping("/{resumeId}")
    public ResponseEntity<ResumeAnalysisDTO> analyze(@PathVariable Long resumeId) {
        log.info("Analyzing resume {}", resumeId);
        return ResponseEntity.ok(ResumeAnalysisDTO.from(analysisService.analyzeResume(resumeId)));
    }

    /**
     * POST /api/resume-analysis/{resumeId}/match/{jobId}
     */
    @PostMapping("/{resumeId}/match/{jobId}")
    public ResponseEntity<ResumeAnalysisDTO> analyzeMatch(
            @PathVariable Long resumeId,
            @PathVariable Long jobId) {
        log.info("Analyzing match for resume {} and job {}", resumeId, jobId);
        return ResponseEntity.ok(ResumeAnalysisDTO.from(analysisService.analyzeMatch(resumeId, jobId)));
    }

    @GetMapping("/match")
    public ResponseEntity<ResumeAnalysisDTO> getMatchAnalysis(@RequestParam Long resumeId, @RequestParam Long jobId) {
        return analysisService.getMatchAnalysis(resumeId, jobId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    /**
     * GET /api/resume-analysis/user/{userId}
     * Service already returns DTOs (conversion happens inside @Transactional session)
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ResumeAnalysisDTO>> getHistory(@PathVariable Long userId) {
        return ResponseEntity.ok(analysisService.getHistory(userId));
    }
}
