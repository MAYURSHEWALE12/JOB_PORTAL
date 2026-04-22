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
                "resource_type", "auto",
                "type", "upload",
                "access_mode", "public"
        );

        return cloudinary.uploader().upload(file.getBytes(), params);
    }

    public String generateSignedUrl(String publicId) {
        return generateSignedUrl(publicId, "image");
    }

    public String generateSignedUrl(String publicId, String resourceType) {
        if (publicId == null || publicId.isEmpty()) return null;
        
        // Remove .pdf from publicId if it exists to avoid duplication
        if (publicId.toLowerCase().endsWith(".pdf")) {
            publicId = publicId.substring(0, publicId.length() - 4);
        }
        
        return cloudinary.url()
                .resourceType(resourceType)
                .format("pdf")
                .signed(true)
                .generate(publicId);
    }

    /**
     * Returns signed URLs for both 'image' and 'raw' resource types.
     * Cloudinary's resource_type:auto may classify PDFs as either.
     */
    public String[] generateSignedUrls(String publicId) {
        return new String[] {
            generateSignedUrl(publicId, "image"),
            generateSignedUrl(publicId, "raw")
        };
    }

    /**
     * Use Cloudinary's explicit API to force an asset's access mode to public.
     * This fixes assets that were uploaded before access_mode was set.
     */
    public void ensurePublicAccess(String publicId) {
        // Try both resource types since we don't know which one Cloudinary used
        for (String resourceType : new String[]{"image", "raw"}) {
            try {
                cloudinary.uploader().explicit(publicId, ObjectUtils.asMap(
                        "resource_type", resourceType,
                        "type", "upload",
                        "access_mode", "public"
                ));
                log.info("Set access_mode=public for {} (resource_type={})", publicId, resourceType);
                return; // Success — no need to try the other type
            } catch (Exception e) {
                log.debug("explicit() with resource_type={} failed for {}: {}", resourceType, publicId, e.getMessage());
            }
        }
        log.warn("Could not update access_mode for {}", publicId);
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
