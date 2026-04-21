package com.jobportal.service;

import com.jobportal.entity.CompanyProfile;
import com.jobportal.entity.User;
import com.jobportal.exception.CustomException;
import com.jobportal.exception.ResourceNotFoundException;
import com.jobportal.repository.CompanyProfileRepository;
import com.jobportal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class CompanyProfileService {

    private final CompanyProfileRepository companyProfileRepository;
    private final UserRepository userRepository;
    private final CloudinaryService cloudinaryService;

    private static final Set<String> ALLOWED_IMAGE_EXTENSIONS = Set.of(".png", ".jpg", ".jpeg", ".gif", ".webp");

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

        try {
            java.util.Map result = cloudinaryService.uploadFile(file, "companies/" + imageType + "s");
            String fileUrl = (String) result.get("secure_url");

            if ("logo".equalsIgnoreCase(imageType)) {
                profile.setLogoUrl(fileUrl);
            } else if ("banner".equalsIgnoreCase(imageType)) {
                profile.setBannerUrl(fileUrl);
            }

            return companyProfileRepository.save(profile);

        } catch (IOException e) {
            log.error("Failed to upload company image to Cloudinary", e);
            throw new CustomException("Failed to upload image to cloud: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private String getFileExtension(String fileName) {
        if (fileName == null || fileName.lastIndexOf(".") == -1) {
            return ".png";
        }
        return fileName.substring(fileName.lastIndexOf("."));
    }
}
