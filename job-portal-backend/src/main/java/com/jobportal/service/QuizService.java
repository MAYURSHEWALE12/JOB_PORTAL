package com.jobportal.service;

import com.jobportal.dto.QuizDTO;
import com.jobportal.dto.QuizSubmissionDTO;
import com.jobportal.dto.QuizViewDTO;
import com.jobportal.entity.*;
import com.jobportal.exception.ResourceNotFoundException;
import com.jobportal.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class QuizService {

    private final QuizRepository           quizRepository;
    private final JobRepository            jobRepository;
    private final JobApplicationRepository applicationRepository;
    private final QuizResultRepository     quizResultRepository;

    /**
     * Create or update a quiz for a job
     */
    /**
     * Create or update a quiz for a job
     */
    public QuizDTO createQuiz(Long jobId, QuizDTO quizDTO) {
        log.info("Creating/Updating quiz for job ID: {}", jobId);
        try {
            Job job = jobRepository.findById(jobId)
                    .orElseThrow(() -> new ResourceNotFoundException("Job", "id", jobId));

            // Check if quiz already exists
            Optional<Quiz> existingQuizOpt = quizRepository.findByJob(job);
            Quiz quiz;

            if (existingQuizOpt.isPresent()) {
                quiz = existingQuizOpt.get();
                log.info("Updating existing quiz (ID: {}) for job: {}", quiz.getId(), jobId);
                quiz.setTitle(quizDTO.getTitle());
                quiz.setDescription(quizDTO.getDescription());
                quiz.setPassingScore(quizDTO.getPassingScore());
                quiz.setTimeLimit(quizDTO.getTimeLimit());
                
                // Clear existing questions to trigger orphan removal
                if (quiz.getQuestions() != null) {
                    quiz.getQuestions().clear();
                } else {
                    quiz.setQuestions(new ArrayList<>());
                }
            } else {
                log.info("Creating new quiz for job: {}", jobId);
                quiz = Quiz.builder()
                        .job(job)
                        .title(quizDTO.getTitle())
                        .description(quizDTO.getDescription())
                        .passingScore(quizDTO.getPassingScore())
                        .timeLimit(quizDTO.getTimeLimit())
                        .questions(new ArrayList<>())
                        .build();
            }

            // Map and add new questions
            List<Question> newQuestions = quizDTO.getQuestions().stream().map(qDto -> {
                Question q = Question.builder()
                        .quiz(quiz)
                        .text(qDto.getText())
                        .score(qDto.getScore() != null ? qDto.getScore() : 1)
                        .build();

                List<Option> options = qDto.getOptions().stream().map(oDto -> 
                    Option.builder()
                            .question(q)
                            .text(oDto.getText())
                            .isCorrect(oDto.isCorrect())
                            .build()
                ).collect(Collectors.toList());

                q.setOptions(options);
                return q;
            }).collect(Collectors.toList());

            quiz.getQuestions().addAll(newQuestions);
            
            Quiz savedQuiz = quizRepository.save(quiz);
            log.info("Successfully saved quiz ID: {}", savedQuiz.getId());
            return QuizDTO.from(savedQuiz);
        } catch (Exception e) {
            log.error("CRITICAL: Failed to save assessment for job {}: {}", jobId, e.getMessage(), e);
            throw e;
        }
    }



    /**
     * Get quiz for a job (candidate view - no correct answers)
     */
    @Transactional(readOnly = true)
    public QuizViewDTO getQuizForJob(Long jobId) {
        Quiz quiz = quizRepository.findByJobId(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz", "jobId", jobId));

        return QuizViewDTO.builder()
                .id(quiz.getId())
                .title(quiz.getTitle())
                .description(quiz.getDescription())
                .timeLimit(quiz.getTimeLimit())
                .questions(quiz.getQuestions().stream().map(q -> 
                    QuizViewDTO.QuestionViewDTO.builder()
                            .id(q.getId())
                            .text(q.getText())
                            .options(q.getOptions().stream().map(o -> 
                                QuizViewDTO.OptionViewDTO.builder()
                                        .id(o.getId())
                                        .text(o.getText())
                                        .build()
                            ).collect(Collectors.toList()))
                            .build()
                ).collect(Collectors.toList()))
                .build();
    }

    /**
     * Submit and grade a quiz
     */
    public QuizResult submitQuiz(QuizSubmissionDTO submission) {
        JobApplication application = applicationRepository.findById(submission.getApplicationId())
                .orElseThrow(() -> new ResourceNotFoundException("Application", "id", submission.getApplicationId()));

        Quiz quiz = quizRepository.findByJob(application.getJob())
                .orElseThrow(() -> new ResourceNotFoundException("Quiz", "job", application.getJob().getId()));

        int totalQuestions = quiz.getQuestions().size();
        int correctAnswers = 0;

        // Map submissions for easy lookup
        Map<Long, Long> answerMap = submission.getAnswers().stream()
                .collect(Collectors.toMap(
                        QuizSubmissionDTO.AnswerDTO::getQuestionId,
                        QuizSubmissionDTO.AnswerDTO::getSelectedOptionId
                ));

        for (Question question : quiz.getQuestions()) {
            Long selectedOptionId = answerMap.get(question.getId());
            if (selectedOptionId != null) {
                boolean isCorrect = question.getOptions().stream()
                        .anyMatch(o -> o.getId().equals(selectedOptionId) && o.isCorrect());
                if (isCorrect) {
                    correctAnswers++;
                }
            }
        }

        int scorePercentage = (int) (((double) correctAnswers / totalQuestions) * 100);
        boolean passed = scorePercentage >= quiz.getPassingScore();

        QuizResult result = QuizResult.builder()
                .application(application)
                .score(scorePercentage)
                .totalQuestions(totalQuestions)
                .correctAnswers(correctAnswers)
                .passed(passed)
                .completedAt(LocalDateTime.now())
                .build();

        return quizResultRepository.save(result);
    }

    /**
     * Get result for an application
     */
    @Transactional(readOnly = true)
    public QuizResult getResult(Long applicationId) {
        return quizResultRepository.findByApplicationId(applicationId).orElse(null);
    }
}
