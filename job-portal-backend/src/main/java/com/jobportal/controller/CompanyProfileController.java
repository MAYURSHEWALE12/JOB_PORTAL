package com.jobportal.controller;

import com.jobportal.entity.CompanyProfile;
import com.jobportal.service.CompanyProfileService;
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
@CrossOrigin(origins = "http://localhost:5173")
public class CompanyProfileController {

    @Value("${app.company.upload-dir}")
    private String uploadDir;

    private final CompanyProfileService companyProfileService;

    @GetMapping
    public ResponseEntity<List<CompanyProfile>> getAllCompanies() {
        return ResponseEntity.ok(companyProfileService.getAllCompanies());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<CompanyProfile> getCompanyByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(companyProfileService.getCompanyByUser(userId));
    }

    @PutMapping("/user/{userId}")
    public ResponseEntity<CompanyProfile> updateCompanyProfile(
            @PathVariable Long userId,
            @RequestBody CompanyProfile profileData) {
        return ResponseEntity.ok(companyProfileService.updateCompanyProfile(userId, profileData));
    }

    @PostMapping("/user/{userId}/upload-logo")
    public ResponseEntity<CompanyProfile> uploadLogo(
            @PathVariable Long userId,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(companyProfileService.uploadImage(userId, file, "logo"));
    }

    @PostMapping("/user/{userId}/upload-banner")
    public ResponseEntity<CompanyProfile> uploadBanner(
            @PathVariable Long userId,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(companyProfileService.uploadImage(userId, file, "banner"));
    }

    // GET /api/companies/image/{fileName}
    @GetMapping("/image/{fileName:.+}")
    public ResponseEntity<Resource> getImage(@PathVariable String fileName) {
        try {
            Path filePath = Paths.get(uploadDir).resolve(fileName);
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
