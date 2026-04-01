package com.jobportal.dto;

import com.jobportal.entity.Resume;
import java.time.LocalDateTime;

public class ResumeDTO {

    public Long id;
    public Long userId;
    public String name;
    public String fileName;
    public LocalDateTime createdAt;

    public static ResumeDTO from(Resume resume) {
        ResumeDTO dto = new ResumeDTO();
        dto.id = resume.getId();
        dto.userId = resume.getUser().getId();
        dto.name = resume.getName();
        dto.fileName = resume.getFileName();
        dto.createdAt = resume.getCreatedAt();
        return dto;
    }
}
