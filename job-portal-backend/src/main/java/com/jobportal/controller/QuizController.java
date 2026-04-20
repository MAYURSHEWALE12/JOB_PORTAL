package com.jobportal.controller;

import com.jobportal.dto.QuizDTO;
import com.jobportal.dto.QuizResultDTO;
import com.jobportal.dto.QuizSubmissionDTO;
import com.jobportal.dto.QuizViewDTO;
import com.jobportal.entity.QuizResult;

import com.jobportal.service.QuizService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/quizzes")
@Tag(name = "Quizzes", description = "Assessment creation and submission")
public class QuizController {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(QuizController.class);
    private final QuizService quizService;

    public QuizController(QuizService quizService) {
        this.quizService = quizService;
    }

    /**
     * POST /api/quizzes/job/{jobId}
     */
    @PostMapping("/job/{jobId}")
    public ResponseEntity<QuizDTO> createQuiz(
            @PathVariable Long jobId,
            @RequestBody QuizDTO quizDTO) {
        log.info("Creating quiz for job {}", jobId);
        return ResponseEntity.status(HttpStatus.CREATED).body(quizService.createQuiz(jobId, quizDTO));
    }


    /**
     * GET /api/quizzes/job/{jobId}
     * Returns full quiz with correct answers (for employers)
     */
    @GetMapping("/job/{jobId}")
    public ResponseEntity<QuizDTO> getFullQuiz(@PathVariable Long jobId) {
        log.info("Fetching full quiz for job {}", jobId);
        QuizDTO quiz = quizService.getFullQuizForJob(jobId);
        return ResponseEntity.ok(quiz);
    }


    /**
     * GET /api/quizzes/job/{jobId}/view
     * Returns quiz view without correct answers (for candidates)
     */
    @GetMapping("/job/{jobId}/view")
    public ResponseEntity<QuizViewDTO> getQuizForCandidate(@PathVariable Long jobId) {
        return ResponseEntity.ok(quizService.getQuizForJob(jobId));
    }

    /**
     * POST /api/quizzes/submit
     */
    @PostMapping("/submit")
    public ResponseEntity<QuizResultDTO> submitQuiz(@RequestBody QuizSubmissionDTO submission) {
        log.info("Submitting quiz for application {}", submission.getApplicationId());
        QuizResult result = quizService.submitQuiz(submission);
        QuizResultDTO dto = QuizResultDTO.builder()
                .id(result.getId())
                .score(result.getScore())
                .totalQuestions(result.getTotalQuestions())
                .correctAnswers(result.getCorrectAnswers())
                .passed(result.isPassed())
                .completedAt(result.getCompletedAt())
                .build();
        return ResponseEntity.ok(dto);
    }

    /**
     * GET /api/quizzes/result/{applicationId}
     */
    @GetMapping("/result/{applicationId}")
    public ResponseEntity<QuizResultDTO> getResult(@PathVariable Long applicationId) {
        QuizResult result = quizService.getResult(applicationId);
        if (result == null) {
            return ResponseEntity.ok(null);
        }
        QuizResultDTO dto = QuizResultDTO.builder()
                .id(result.getId())
                .score(result.getScore())
                .totalQuestions(result.getTotalQuestions())
                .correctAnswers(result.getCorrectAnswers())
                .passed(result.isPassed())
                .completedAt(result.getCompletedAt())
                .build();
        return ResponseEntity.ok(dto);
    }
}
