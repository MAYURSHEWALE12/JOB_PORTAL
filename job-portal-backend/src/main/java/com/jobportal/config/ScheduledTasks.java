package com.jobportal.config;

import com.jobportal.service.JobService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@EnableScheduling
@RequiredArgsConstructor
@Slf4j
public class ScheduledTasks {

    private final JobService jobService;

    @Scheduled(cron = "0 0 2 * * ?")
    public void expireJobs() {
        log.info("Running scheduled job expiry task...");
        try {
            int expired = jobService.expireJobs();
            if (expired > 0) {
                log.info("Expired {} jobs in scheduled task", expired);
            }
        } catch (Exception e) {
            log.error("Error in scheduled job expiry task: {}", e.getMessage(), e);
        }
    }
}
