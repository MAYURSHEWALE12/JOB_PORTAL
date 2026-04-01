package com.jobportal.dto;

import com.jobportal.entity.ResumeAnalysis;
import java.time.LocalDateTime;
import java.util.List;
import java.lang.String;
import java.util.ArrayList;
import java.util.Arrays;
public class ResumeAnalysisDTO {
    public Long id;
    public Long userId;
    public SimpleResume resume;
    public SimpleJob job;
    public Integer score;
    public List<String> suggestions;
    public List<String> strengths;
    public List<String> missingKeywords;
    public String matchDetails;
    public LocalDateTime analyzedAt;

    public static class SimpleResume {
        public Long id;
        public String name;
        public SimpleResume(Long id, String name) { this.id = id; this.name = name; }
    }

    public static class SimpleJob {
        public Long id;
        public String title;
        public String companyName;
        public SimpleJob(Long id, String title, String companyName) { 
            this.id = id; 
            this.title = title; 
            this.companyName = companyName;
        }
    }

    public static ResumeAnalysisDTO from(ResumeAnalysis entity) {
        if (entity == null) return null;
        ResumeAnalysisDTO dto = new ResumeAnalysisDTO();
        dto.id = entity.getId();
        if (entity.getUser() != null) dto.userId = entity.getUser().getId();
        if (entity.getResume() != null) {
            dto.resume = new SimpleResume(entity.getResume().getId(), entity.getResume().getName());
        }
        if (entity.getJob() != null) {
            String company = "Unknown";
            if (entity.getJob().getEmployer() != null && entity.getJob().getEmployer().getCompanyProfile() != null) {
                company = entity.getJob().getEmployer().getCompanyProfile().getCompanyName();
            }
            dto.job = new SimpleJob(entity.getJob().getId(), entity.getJob().getTitle(), company);
        }

        dto.score = entity.getScore();
        dto.suggestions = entity.getSuggestions() != null ? new ArrayList<>(entity.getSuggestions()) : new ArrayList<>();
        dto.strengths = entity.getStrengths() != null ? new ArrayList<>(entity.getStrengths()) : new ArrayList<>();
        dto.matchDetails = entity.getMatchDetails();
        dto.missingKeywords = parseMissingKeywords(entity.getMatchDetails());
        dto.analyzedAt = entity.getAnalyzedAt();
        return dto;
    }

    private static List<String> parseMissingKeywords(String matchDetails) {
        if (matchDetails == null || matchDetails.isBlank()) {
            return new ArrayList<>();
        }

        return Arrays.stream(matchDetails.split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .collect(ArrayList::new, ArrayList::add, ArrayList::addAll);
    }
}
