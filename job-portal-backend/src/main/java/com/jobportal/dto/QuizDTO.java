package com.jobportal.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizDTO {

    private Long id;
    private String title;
    private String description;
    private Integer passingScore;
    private Integer timeLimit;
    private List<QuestionDTO> questions;

    public static QuizDTO from(com.jobportal.entity.Quiz quiz) {
        if (quiz == null) return null;
        return QuizDTO.builder()
                .id(quiz.getId())
                .title(quiz.getTitle())
                .description(quiz.getDescription())
                .passingScore(quiz.getPassingScore())
                .timeLimit(quiz.getTimeLimit())
                .questions(quiz.getQuestions().stream().map(QuestionDTO::from).collect(java.util.stream.Collectors.toList()))
                .build();
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class QuestionDTO {
        private Long id;
        private String text;
        private List<OptionDTO> options;
        private Integer score;

        public static QuestionDTO from(com.jobportal.entity.Question q) {
            return QuestionDTO.builder()
                    .id(q.getId())
                    .text(q.getText())
                    .score(q.getScore())
                    .options(q.getOptions().stream().map(OptionDTO::from).collect(java.util.stream.Collectors.toList()))
                    .build();
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OptionDTO {
        private Long id;
        private String text;
        private boolean isCorrect;

        public static OptionDTO from(com.jobportal.entity.Option o) {
            return OptionDTO.builder()
                    .id(o.getId())
                    .text(o.getText())
                    .isCorrect(o.isCorrect())
                    .build();
        }
    }
}

