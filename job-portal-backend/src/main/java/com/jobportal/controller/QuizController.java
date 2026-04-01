package com.jobportal.controller;

import com.jobportal.dto.QuizDTO;
import com.jobportal.dto.QuizSubmissionDTO;
import com.jobportal.dto.QuizViewDTO;
import com.jobportal.entity.QuizResult;

import com.jobportal.service.QuizService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/quizzes")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "http://localhost:5173")
public class QuizController {

    private final QuizService quizService;

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
     * GET /api/quizzes/job/{jobId}/view
     */
    @GetMapping("/job/{jobId}/view")
    public ResponseEntity<QuizViewDTO> getQuizForCandidate(@PathVariable Long jobId) {
        return ResponseEntity.ok(quizService.getQuizForJob(jobId));
    }

    /**
     * POST /api/quizzes/submit
     */
    @PostMapping("/submit")
    public ResponseEntity<QuizResult> submitQuiz(@RequestBody QuizSubmissionDTO submission) {
        log.info("Submitting quiz for application {}", submission.getApplicationId());
        return ResponseEntity.ok(quizService.submitQuiz(submission));
    }

    /**
     * GET /api/quizzes/result/{applicationId}
     */
    @GetMapping("/result/{applicationId}")
    public ResponseEntity<QuizResult> getResult(@PathVariable Long applicationId) {
        QuizResult result = quizService.getResult(applicationId);
        return ResponseEntity.ok(result); // Return null in body with 200 OK
    }
}
