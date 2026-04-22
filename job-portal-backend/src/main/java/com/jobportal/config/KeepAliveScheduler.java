package com.jobportal.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.net.HttpURLConnection;
import java.net.URL;

/**
 * Keep-alive scheduler for Render free tier.
 * Pings the backend's own public URL every 14 minutes to prevent
 * Render from spinning down the instance due to inactivity.
 */
@Component
@EnableScheduling
@Slf4j
public class KeepAliveScheduler {

    @Value("${RENDER_EXTERNAL_URL:}")
    private String renderExternalUrl;

    @Scheduled(fixedRate = 13 * 60 * 1000) // Every 14 minutes
    public void keepAlive() {
        if (renderExternalUrl == null || renderExternalUrl.isEmpty()) {
            // Not running on Render (e.g., local dev), skip the ping
            return;
        }

        try {
            String healthUrl = renderExternalUrl + "/api/health";
            HttpURLConnection connection = (HttpURLConnection) new URL(healthUrl).openConnection();
            connection.setRequestMethod("GET");
            connection.setConnectTimeout(5000);
            connection.setReadTimeout(5000);

            int responseCode = connection.getResponseCode();
            log.info("Keep-alive ping sent to {} — Response: {}", healthUrl, responseCode);

            connection.disconnect();
        } catch (Exception e) {
            log.warn("Keep-alive ping failed: {}", e.getMessage());
        }
    }
}
