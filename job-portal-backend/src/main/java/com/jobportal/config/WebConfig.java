package com.jobportal.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.resume.upload-dir}")
    private String resumeDir;

    @Value("${app.company.upload-dir}")
    private String companyDir;

    @Value("${app.avatar.upload-dir}")
    private String avatarDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/uploads/resumes/**")
                .addResourceLocations("file:" + resumeDir + "/");
        
        registry.addResourceHandler("/uploads/companies/**")
                .addResourceLocations("file:" + companyDir + "/");

        registry.addResourceHandler("/uploads/avatars/**")
                .addResourceLocations("file:" + avatarDir + "/");
    }
}
