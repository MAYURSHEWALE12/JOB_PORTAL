package com.jobportal.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@Slf4j
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public CloudinaryService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    /**
     * Upload an image or file to Cloudinary
     * @param file Multipart file
     * @param folder Folder name in Cloudinary (e.g., "avatars", "resumes")
     * @return Map containing upload result (including "secure_url")
     */
    public Map uploadFile(MultipartFile file, String folder) throws IOException {
        log.info("Uploading file to Cloudinary folder: {}", folder);
        
        Map params = ObjectUtils.asMap(
                "folder", "job_portal/" + folder,
                "resource_type", "auto" // Auto-detect for images vs PDFs
        );

        return cloudinary.uploader().upload(file.getBytes(), params);
    }

    /**
     * Delete a file from Cloudinary
     * @param publicId Public ID of the file
     * @throws IOException
     */
    public void deleteFile(String publicId) throws IOException {
        log.info("Deleting file from Cloudinary: {}", publicId);
        cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
    }

    @Configuration
    public static class CloudinaryConfig {
        @Value("${CLOUDINARY_CLOUD_NAME}")
        private String cloudName;

        @Value("${CLOUDINARY_API_KEY}")
        private String apiKey;

        @Value("${CLOUDINARY_API_SECRET}")
        private String apiSecret;

        @Bean
        public Cloudinary cloudinary() {
            return new Cloudinary(ObjectUtils.asMap(
                    "cloud_name", cloudName,
                    "api_key", apiKey,
                    "api_secret", apiSecret,
                    "secure", true
            ));
        }
    }
}
