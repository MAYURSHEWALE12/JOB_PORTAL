package com.jobportal.controller;

import com.jobportal.entity.CompanyProfile;
import com.jobportal.security.SecurityUtil;
import com.jobportal.service.CompanyProfileService;
import jakarta.servlet.http.HttpServletRequest;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.net.MalformedURLException;

@RestController
@RequestMapping("/companies")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Companies", description = "Company profile and branding")
public class CompanyProfileController {

    @Value("${app.company.upload-dir}")
    private String uploadDir;

    private final CompanyProfileService companyProfileService;
    private final SecurityUtil securityUtil;

    @GetMapping
    public ResponseEntity<List<CompanyProfile>> getAllCompanies() {
        return ResponseEntity.ok(companyProfileService.getAllCompanies());
    }

    @GetMapping("/user")
    public ResponseEntity<CompanyProfile> getCompanyByUser(HttpServletRequest request) {
        Long userId = securityUtil.getCurrentUserId(request);
        return ResponseEntity.ok(companyProfileService.getCompanyByUser(userId));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<CompanyProfile> getCompanyByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(companyProfileService.getCompanyByUser(userId));
    }

    @PutMapping("/user")
    public ResponseEntity<CompanyProfile> updateCompanyProfile(
            @RequestBody CompanyProfile profileData,
            HttpServletRequest request) {
        Long userId = securityUtil.getCurrentUserId(request);
        return ResponseEntity.ok(companyProfileService.updateCompanyProfile(userId, profileData));
    }

    @PostMapping("/user/upload-logo")
    public ResponseEntity<CompanyProfile> uploadLogo(
            @RequestParam("file") MultipartFile file,
            HttpServletRequest request) {
        Long userId = securityUtil.getCurrentUserId(request);
        return ResponseEntity.ok(companyProfileService.uploadImage(userId, file, "logo"));
    }

    @PostMapping("/user/upload-banner")
    public ResponseEntity<CompanyProfile> uploadBanner(
            @RequestParam("file") MultipartFile file,
            HttpServletRequest request) {
        Long userId = securityUtil.getCurrentUserId(request);
        return ResponseEntity.ok(companyProfileService.uploadImage(userId, file, "banner"));
    }

    // GET /api/companies/image/{fileName}
    @GetMapping("/image/{fileName:.+}")
    public ResponseEntity<Resource> getImage(@PathVariable String fileName) {
        try {
            Path filePath = Paths.get(uploadDir).resolve(fileName).normalize();
            if (!filePath.startsWith(Paths.get(uploadDir).normalize())) {
                return ResponseEntity.badRequest().build();
            }
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() || resource.isReadable()) {
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (MalformedURLException e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
