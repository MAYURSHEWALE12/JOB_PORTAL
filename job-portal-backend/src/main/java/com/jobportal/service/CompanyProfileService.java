package com.jobportal.service;

import com.jobportal.entity.CompanyProfile;
import com.jobportal.entity.User;
import com.jobportal.exception.CustomException;
import com.jobportal.exception.ResourceNotFoundException;
import com.jobportal.repository.CompanyProfileRepository;
import com.jobportal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class CompanyProfileService {

    private final CompanyProfileRepository companyProfileRepository;
    private final UserRepository userRepository;

    private static final Set<String> ALLOWED_IMAGE_EXTENSIONS = Set.of(".png", ".jpg", ".jpeg", ".gif", ".webp");

    @Value("${app.company.upload-dir}")
    private String uploadDir;

    public List<CompanyProfile> getAllCompanies() {
        return companyProfileRepository.findAll();
    }

    public CompanyProfile getCompanyByUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        return companyProfileRepository.findByUser(user)
                .orElseThrow(() -> new ResourceNotFoundException("CompanyProfile", "userId", userId));
    }

    public CompanyProfile updateCompanyProfile(Long userId, CompanyProfile profileData) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        CompanyProfile profile = companyProfileRepository.findByUser(user)
                .orElse(new CompanyProfile());

        profile.setUser(user);
        profile.setCompanyName(profileData.getCompanyName());
        profile.setWebsite(profileData.getWebsite());
        profile.setLocation(profileData.getLocation());
        profile.setIndustry(profileData.getIndustry());
        profile.setEmployeeCount(profileData.getEmployeeCount());
        profile.setDescription(profileData.getDescription());
        profile.setFoundedYear(profileData.getFoundedYear());
        profile.setSpecialties(profileData.getSpecialties());
        profile.setLinkedin(profileData.getLinkedin());
        profile.setTwitter(profileData.getTwitter());
        profile.setGithub(profileData.getGithub());

        return companyProfileRepository.save(profile);
    }

    public CompanyProfile uploadImage(Long userId, MultipartFile file, String imageType) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        CompanyProfile profile = companyProfileRepository.findByUser(user)
                .orElseThrow(() -> new CustomException("Company profile must be created before uploading images", HttpStatus.BAD_REQUEST));

        if (file.isEmpty()) {
            throw new CustomException("Please select a file", HttpStatus.BAD_REQUEST);
        }

        String originalFilename = file.getOriginalFilename();
        String extension = getFileExtension(originalFilename).toLowerCase();
        if (!ALLOWED_IMAGE_EXTENSIONS.contains(extension)) {
            throw new CustomException("Only image files are allowed (PNG, JPG, JPEG, GIF, WEBP)", HttpStatus.BAD_REQUEST);
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new CustomException("Invalid file content type. Only image files are allowed", HttpStatus.BAD_REQUEST);
        }

        try {
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String fileName = imageType + "_" + userId + "_" + UUID.randomUUID() + extension;
            Path filePath = uploadPath.resolve(fileName);
            
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            if ("logo".equalsIgnoreCase(imageType)) {
                profile.setLogoUrl("/api/companies/image/" + fileName);
            } else if ("banner".equalsIgnoreCase(imageType)) {
                profile.setBannerUrl("/api/companies/image/" + fileName);
            }

            return companyProfileRepository.save(profile);

        } catch (IOException e) {
            log.error("Failed to upload company image", e);
            throw new CustomException("Failed to upload image: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private String getFileExtension(String fileName) {
        if (fileName == null || fileName.lastIndexOf(".") == -1) {
            return ".png";
        }
        return fileName.substring(fileName.lastIndexOf("."));
    }
}
