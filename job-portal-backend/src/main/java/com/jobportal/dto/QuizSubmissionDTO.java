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
public class QuizSubmissionDTO {

    private Long applicationId;
    private List<AnswerDTO> answers;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AnswerDTO {
        private Long questionId;
        private Long selectedOptionId;
    }
}
