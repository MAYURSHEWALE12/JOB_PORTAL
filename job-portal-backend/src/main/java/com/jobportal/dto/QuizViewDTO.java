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
public class QuizViewDTO {

    private Long id;
    private String title;
    private String description;
    private Integer timeLimit;
    private List<QuestionViewDTO> questions;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class QuestionViewDTO {
        private Long id;
        private String text;
        private List<OptionViewDTO> options;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OptionViewDTO {
        private Long id;
        private String text;
    }
}
