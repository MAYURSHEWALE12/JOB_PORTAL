package com.jobportal.config;

import com.jobportal.entity.User;
import com.jobportal.entity.UserRole;
import com.jobportal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class AdminInitializer implements CommandLineRunner {

    private final UserRepository userRepository;

    @Override
    public void run(String... args) {
        // Read the admin email from the environment variable
        String adminEmail = System.getProperty("ADMIN_EMAIL");
        
        if (adminEmail == null || adminEmail.isEmpty()) {
            log.info("No ADMIN_EMAIL set. Skipping auto-promotion.");
            return;
        }

        log.info("Checking for user to promote to ADMIN: {}", adminEmail);

        Optional<User> userOpt = userRepository.findByEmail(adminEmail);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getRole() != UserRole.ADMIN) {
                user.setRole(UserRole.ADMIN);
                userRepository.save(user);
                log.info("SUCCESS: User {} has been promoted to ADMIN!", adminEmail);
            } else {
                log.info("User {} is already an ADMIN.", adminEmail);
            }
        } else {
            log.warn("User {} not found. Registration might not be complete yet for this email.", adminEmail);
        }
    }
}
