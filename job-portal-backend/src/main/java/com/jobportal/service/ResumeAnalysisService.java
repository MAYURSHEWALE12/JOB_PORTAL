package com.jobportal.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobportal.dto.ResumeAnalysisDTO;
import com.jobportal.entity.Job;
import com.jobportal.entity.Resume;
import com.jobportal.entity.ResumeAnalysis;
import com.jobportal.entity.User;
import com.jobportal.exception.ResourceNotFoundException;
import com.jobportal.repository.JobRepository;
import com.jobportal.repository.ResumeAnalysisRepository;
import com.jobportal.repository.ResumeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.hibernate.Hibernate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.*;
import java.net.URL;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ResumeAnalysisService {

    private final ResumeAnalysisRepository analysisRepository;
    private final ResumeRepository         resumeRepository;
    private final JobRepository            jobRepository;
    private final CloudinaryService       cloudinaryService;

    private record MatchComputation(int score, List<String> missingKeywords) {}

    /**
     * Analyze a resume (General ATS Score)
     */
    public ResumeAnalysis analyzeResume(Long resumeId) {
        Resume resume = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new ResourceNotFoundException("Resume", "id", resumeId));

        String text = extractText(resume);
        return performAnalysis(resume, null, text);
    }

    /**
     * Analyze resume against a specific Job
     */
    public ResumeAnalysis analyzeMatch(Long resumeId, Long jobId) {
        Resume resume = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new ResourceNotFoundException("Resume", "id", resumeId));
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job", "id", jobId));

        String text = extractText(resume);
        return performAnalysis(resume, job, text);
    }

    private String extractText(Resume resume) {
        String fileName = resume.getFileName();

        if (fileName == null || fileName.isEmpty()) {
            throw new RuntimeException("Resume file name not found.");
        }

        try {
            // Resolve publicId
            String publicId = resume.getPublicId();
            if (publicId == null || publicId.isEmpty()) {
                publicId = extractPublicIdFromUrl(fileName);
            }

            if (publicId != null && !publicId.isEmpty()) {
                // Use Cloudinary's explicit API — returns a working secure_url
                String cloudinaryUrl = cloudinaryService.ensurePublicAccess(publicId);
                if (cloudinaryUrl != null) {
                    log.info("Using Cloudinary API URL: {}", cloudinaryUrl);
                    String text = tryFetchPdf(cloudinaryUrl);
                    if (text != null) return text;
                }

                // Fallback: try signed URLs with both resource types
                String[] signedUrls = cloudinaryService.generateSignedUrls(publicId);
                for (String signedUrl : signedUrls) {
                    log.info("Trying signed URL: {}", signedUrl);
                    String text = tryFetchPdf(signedUrl);
                    if (text != null) return text;
                }
            }

            // Last resort: try original URL directly
            if (fileName.startsWith("http")) {
                log.info("Fallback: direct fetch from {}", fileName);
                String text = tryFetchPdf(fileName);
                if (text != null) return text;
            }

            throw new RuntimeException("All PDF fetch strategies failed for resume: " + resume.getId());
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to extract text from resume: {}", e.getMessage());
            throw new RuntimeException("Could not read resume PDF content: " + e.getMessage());
        }
    }

    private String tryFetchPdf(String pdfUrl) {
        try {
            java.net.URL url = new java.net.URL(pdfUrl);
            java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(10000);
            conn.setInstanceFollowRedirects(true);
            int responseCode = conn.getResponseCode();
            log.info("HTTP {} from: {}", responseCode, pdfUrl);

            if (responseCode != 200) {
                log.warn("Non-200 response ({}) from {}", responseCode, pdfUrl);
                return null;
            }

            try (PDDocument document = PDDocument.load(conn.getInputStream())) {
                PDFTextStripper stripper = new PDFTextStripper();
                return stripper.getText(document);
            }
        } catch (Exception e) {
            log.warn("Failed to fetch PDF from {}: {}", pdfUrl, e.getMessage());
            return null;
        }
    }

    private String extractPublicIdFromUrl(String url) {
        if (url == null || !url.contains("job_portal/resumes/")) {
            return null;
        }
        // Keep the full folder path — Cloudinary needs "job_portal/resumes/xyz", not just "xyz"
        int idx = url.indexOf("job_portal/");
        String part = url.substring(idx);
        // Remove file extension if present
        int dotIdx = part.lastIndexOf('.');
        if (dotIdx > 0) {
            part = part.substring(0, dotIdx);
        }
        return part.isEmpty() ? null : part;
    }

    private ResumeAnalysis performAnalysis(Resume resume, Job job, String text) {
        int score = 0;
        List<String> suggestions = new ArrayList<>();
        List<String> strengths = new ArrayList<>();
        String normalizedText = text.toLowerCase();

        // 1. Structure Check (Sections)
        Map<String, List<String>> sectionKeywords = new HashMap<>();
        sectionKeywords.put("Experience", Arrays.asList("experience", "work history", "employment", "professional background"));
        sectionKeywords.put("Skills", Arrays.asList("skills", "technical skills", "competencies", "expertise"));
        sectionKeywords.put("Education", Arrays.asList("education", "academic", "university", "degree", "certification"));
        sectionKeywords.put("Projects", Arrays.asList("projects", "portfolio", "key achievements"));
        sectionKeywords.put("Contact", Arrays.asList("contact", "phone", "email", "linkedin", "address"));

        for (Map.Entry<String, List<String>> entry : sectionKeywords.entrySet()) {
            boolean found = entry.getValue().stream().anyMatch(normalizedText::contains);
            if (found) {
                score += 10;
                strengths.add("Strong section header identified for: " + entry.getKey());
            } else {
                suggestions.add("Consider adding or clarifying the '" + entry.getKey() + "' section header.");
            }
        }

        // 2. Length Check
        String[] words = text.split("\\s+");
        if (words.length < 200) {
            score += 5;
            suggestions.add("The resume seems a bit short. Add more detail about your specific contributions.");
        } else if (words.length > 300 && words.length < 800) {
            score += 15;
            strengths.add("Excellent resume length and detail density.");
        } else {
            score += 10;
            suggestions.add("Resume is quite long. Ensure you prioritize the most relevant information for ATS readability.");
        }

        // 3. Contact Info Presence (Email/Phone)
        if (normalizedText.contains("@") && normalizedText.contains(".com")) {
            score += 10;
            strengths.add("Contact email address detected.");
        } else {
            suggestions.add("Couldn't find a clear email address. Ensure your contact info is easy to find.");
        }

        // 4. Job Match (If Job is provided)
        String matchDetails = null;
        List<String> interviewQuestions = new ArrayList<>();
        Map<String, Integer> skillMap = new HashMap<>();

        if (job != null) {
            MatchComputation matchComputation = calculateMatch(normalizedText, job, suggestions);
            int matchScore = matchComputation.score();

            score = (score + matchScore) / 2; // Average general + specific
            matchDetails = String.join(",", matchComputation.missingKeywords());
            
            // Intelligence: Generate Skill Map
            skillMap = generateSkillMap(normalizedText, job);
            
            // Intelligence: Generate Interview Strategy
            interviewQuestions = generateInterviewQuestions(matchComputation.missingKeywords());
            
            if (matchScore > 70) {
                strengths.add("High keyword alignment with the " + job.getTitle() + " role.");
            } else {
                suggestions.add("Your resume lacks some key requirements for the " + job.getTitle() + " position. Tailor your skills section.");
            }
        }

        // Final Cap
        score = Math.min(100, score + 10); 

        ObjectMapper mapper = new ObjectMapper();
        String skillMapJson = "{}";
        try {
            skillMapJson = mapper.writeValueAsString(skillMap);
        } catch (Exception e) {
            log.error("Failed to map skills to JSON: {}", e.getMessage());
        }

        ResumeAnalysis analysis = ResumeAnalysis.builder()
                .resume(resume)
                .user(resume.getUser())
                .job(job)
                .score(score)
                .suggestions(suggestions)
                .strengths(strengths)
                .interviewQuestions(interviewQuestions)
                .skillAlignmentJson(skillMapJson)
                .matchDetails(matchDetails)
                .analyzedAt(LocalDateTime.now())
                .build();

        return analysisRepository.save(analysis);
    }

    private static final Set<String> STOP_WORDS = new HashSet<>(Arrays.asList(
        "about", "above", "after", "again", "against", "all", "and", "any", "are", "because",
        "been", "before", "being", "below", "between", "both", "but", "could", "did", "does",
        "doing", "down", "during", "each", "few", "for", "from", "further", "had", "has", "have",
        "having", "here", "how", "into", "its", "just", "more", "most", "other", "our", "out",
        "over", "same", "should", "some", "such", "than", "that", "the", "their", "them", "then",
        "there", "these", "they", "this", "those", "through", "too", "under", "until", "very",
        "was", "were", "what", "when", "where", "which", "while", "who", "whom", "why", "with",
        "would", "your", "yourself", "yourselves", "professional", "experience", "excellent", "proven"
    ));

    private MatchComputation calculateMatch(String resumeText, Job job, List<String> suggestions) {
        String jobText = (job.getTitle() + " " + job.getDescription() + " " + job.getRequirements()).toLowerCase();
        
        // Extract technical/important keywords (simple word frequency/length filter)
        String[] jobWords = jobText.split("[^a-zA-Z0-9]+");
        Set<String> uniqueJobKeywords = Arrays.stream(jobWords)
                .filter(w -> w.length() > 3 && !STOP_WORDS.contains(w))
                .collect(Collectors.toSet());

        if (uniqueJobKeywords.isEmpty()) {
            return new MatchComputation(50, new ArrayList<>());
        }

        List<String> missingKeywords = uniqueJobKeywords.stream()
                .filter(word -> !resumeText.contains(word))
                .limit(10) // Limit to top 10 missing
                .collect(Collectors.toList());

        long matchingCount = uniqueJobKeywords.size() - missingKeywords.size();
        int matchScore = (int) (((double) matchingCount / uniqueJobKeywords.size()) * 100);

        if (!missingKeywords.isEmpty()) {
            String missingStr = String.join(", ", missingKeywords);
            suggestions.add("🎯 TAILORING TIP: Your resume is missing some keywords found in the job description: " + missingStr + ". Try to incorporate these naturally.");
        }

        return new MatchComputation(matchScore, missingKeywords);
    }


    private Map<String, Integer> generateSkillMap(String resumeText, Job job) {
        Map<String, Integer> map = new HashMap<>();
        String jobText = (job.getTitle() + " " + job.getDescription() + " " + job.getRequirements()).toLowerCase();
        
        Map<String, List<String>> categories = new HashMap<>();
        categories.put("Technical", Arrays.asList("react", "java", "python", "sql", "aws", "cloud", "api", "software", "development", "data", "git", "backend", "frontend"));
        categories.put("Soft Skills", Arrays.asList("communication", "teamwork", "leadership", "agile", "problem-solving", "critical thinking", "collaboration", "adaptability"));
        categories.put("Experience", Arrays.asList("senior", "years", "management", "directed", "lead", "optimized", "implemented", "managed", "delivered"));
        categories.put("Education", Arrays.asList("degree", "university", "bachelor", "master", "phd", "certification", "trained", "graduate"));

        for (Map.Entry<String, List<String>> entry : categories.entrySet()) {
            long jobCount = entry.getValue().stream().filter(jobText::contains).count();
            if (jobCount == 0) {
                map.put(entry.getKey(), 50); // Default middle ground if no keywords found in job
                continue;
            }
            long resumeCount = entry.getValue().stream().filter(resumeText::contains).count();
            int alignment = (int) Math.min(100, ((double) resumeCount / jobCount) * 100);
            map.put(entry.getKey(), alignment);
        }
        return map;
    }

    private List<String> generateInterviewQuestions(List<String> missingKeywords) {
        List<String> questions = new ArrayList<>();
        if (missingKeywords.isEmpty()) {
            questions.add("Tell me about your most challenging project using the core tech stack.");
            questions.add("How do you handle conflict in a fast-paced development team?");
            questions.add("What is your approach to learning new technologies when they are introduced to a project?");
            return questions;
        }

        // Targeted questions based on gaps
        for (int i = 0; i < Math.min(3, missingKeywords.size()); i++) {
            String keyword = missingKeywords.get(i);
            questions.add("The candidate seems to lack direct experience with '" + keyword + "'. Ask: 'Can you describe a time when you used a technology similar to " + keyword + ", or how you would approach learning it on the job?'");
        }
        
        if (questions.size() < 3) {
            questions.add("Walk me through your process for troubleshooting a complex technical bug.");
        }
        
        return questions;
    }

    @Transactional(readOnly = true)
    public List<ResumeAnalysisDTO> getHistory(Long userId) {
        return analysisRepository.findByUserIdOrderByAnalyzedAtDesc(userId)
                .stream()
                .map(ResumeAnalysisDTO::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<ResumeAnalysisDTO> getMatchAnalysis(Long resumeId, Long jobId) {
        Resume resume = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new ResourceNotFoundException("Resume", "id", resumeId));
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job", "id", jobId));

        List<ResumeAnalysis> analyses = analysisRepository.findTopByResumeAndJobOrderByAnalyzedAtDesc(resume, job);
        if (analyses.isEmpty()) return Optional.empty();

        ResumeAnalysis analysis = analyses.get(0);
        return Optional.of(ResumeAnalysisDTO.from(analysis));
    }

    @Transactional(readOnly = true)
    public boolean isEmployerForResume(Long resumeId, Long employerId) {
        return analysisRepository.existsByResumeIdAndJobEmployerId(resumeId, employerId);
    }
}
