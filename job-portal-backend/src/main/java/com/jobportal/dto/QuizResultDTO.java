package com.jobportal.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizResultDTO {
    private Long id;
    private Integer score;
    private Integer totalQuestions;
    private Integer correctAnswers;
    private boolean passed;
    private LocalDateTime completedAt;
}
