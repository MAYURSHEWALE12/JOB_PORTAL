package com.jobportal.security;

import com.jobportal.entity.User;
import com.jobportal.entity.UserRole;
import com.jobportal.repository.UserRepository;
import com.jobportal.service.EmailService;
import com.jobportal.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;
    private final EmailService emailService;
    private final NotificationService notificationService;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        String email = extractEmail(oAuth2User, registrationId);
        String providerId = extractProviderId(oAuth2User, registrationId);
        String firstName = extractFirstName(oAuth2User, registrationId);
        String lastName = extractLastName(oAuth2User, registrationId);
        String profileImageUrl = extractProfileImage(oAuth2User, registrationId);

        log.info("OAuth2 login from {} with email: {}", registrationId, email);

        boolean isNewUser = userRepository.findByEmail(email).isEmpty();

        User user = userRepository.findByEmail(email)
                .map(existingUser -> updateExistingUser(existingUser, registrationId, providerId, firstName, lastName, profileImageUrl))
                .orElseGet(() -> createNewUser(email, firstName, lastName, registrationId, providerId, profileImageUrl));

        if (isNewUser) {
            log.info("New OAuth2 user registered: {} via {}", user.getEmail(), registrationId);
            notificationService.sendNotification(
                    user.getId(),
                    "Welcome to Job Portal!",
                    "Your account has been created successfully via " + registrationId + ". Explore your dashboard to get started.",
                    "SUCCESS"
            );
            emailService.sendWelcomeEmail(
                    user.getEmail(),
                    user.getFirstName(),
                    user.getRole().toString()
            );
        }

        return new OAuth2UserPrincipal(oAuth2User, user);
    }

    private User updateExistingUser(User existingUser, String provider, String providerId, String firstName, String lastName, String profileImageUrl) {
        if (existingUser.getAuthProvider() == null || "LOCAL".equals(existingUser.getAuthProvider())) {
            existingUser.setAuthProvider(provider.toUpperCase());
            existingUser.setProviderId(providerId);
        }
        if (existingUser.getFirstName() == null || existingUser.getFirstName().isEmpty()) {
            existingUser.setFirstName(firstName);
        }
        if (existingUser.getLastName() == null || existingUser.getLastName().isEmpty()) {
            existingUser.setLastName(lastName);
        }
        if (profileImageUrl != null && (existingUser.getProfileImageUrl() == null || existingUser.getProfileImageUrl().isEmpty())) {
            existingUser.setProfileImageUrl(profileImageUrl);
        }
        return userRepository.save(existingUser);
    }

    private User createNewUser(String email, String firstName, String lastName, String provider, String providerId, String profileImageUrl) {
        log.info("Creating new user from OAuth2 provider: {} with email: {}", provider, email);

        User user = User.builder()
                .email(email)
                .password("OAUTH2_USER")
                .firstName(firstName != null && !firstName.isEmpty() ? firstName : "User")
                .lastName(lastName != null && !lastName.isEmpty() ? lastName : "")
                .role(UserRole.JOBSEEKER)
                .authProvider(provider.toUpperCase())
                .providerId(providerId)
                .profileImageUrl(profileImageUrl)
                .build();

        return userRepository.save(user);
    }

    private String extractEmail(OAuth2User oAuth2User, String registrationId) {
        Map<String, Object> attributes = oAuth2User.getAttributes();
        if ("google".equals(registrationId)) {
            return (String) attributes.get("email");
        } else if ("github".equals(registrationId)) {
            return (String) attributes.get("email");
        } else if ("linkedin".equals(registrationId)) {
            return (String) attributes.get("email");
        }
        return (String) attributes.get("email");
    }

    private String extractProviderId(OAuth2User oAuth2User, String registrationId) {
        Map<String, Object> attributes = oAuth2User.getAttributes();
        if ("google".equals(registrationId)) {
            return (String) attributes.get("sub");
        } else if ("github".equals(registrationId)) {
            return String.valueOf(attributes.get("id"));
        } else if ("linkedin".equals(registrationId)) {
            return (String) attributes.get("sub");
        }
        return (String) attributes.get("id");
    }

    private String extractFirstName(OAuth2User oAuth2User, String registrationId) {
        Map<String, Object> attributes = oAuth2User.getAttributes();
        if ("google".equals(registrationId)) {
            return (String) attributes.get("given_name");
        } else if ("github".equals(registrationId)) {
            String name = (String) attributes.get("name");
            if (name != null && name.contains(" ")) {
                return name.split(" ")[0];
            }
            return (String) attributes.get("login");
        } else if ("linkedin".equals(registrationId)) {
            return (String) attributes.get("given_name");
        }
        return (String) attributes.get("name");
    }

    private String extractLastName(OAuth2User oAuth2User, String registrationId) {
        Map<String, Object> attributes = oAuth2User.getAttributes();
        if ("google".equals(registrationId)) {
            return (String) attributes.get("family_name");
        } else if ("github".equals(registrationId)) {
            String name = (String) attributes.get("name");
            if (name != null && name.contains(" ")) {
                String[] parts = name.split(" ");
                return parts.length > 1 ? parts[parts.length - 1] : "";
            }
            return "";
        } else if ("linkedin".equals(registrationId)) {
            return (String) attributes.get("family_name");
        }
        return "";
    }

    private String extractProfileImage(OAuth2User oAuth2User, String registrationId) {
        Map<String, Object> attributes = oAuth2User.getAttributes();
        if ("google".equals(registrationId)) {
            return (String) attributes.get("picture");
        } else if ("github".equals(registrationId)) {
            return (String) attributes.get("avatar_url");
        } else if ("linkedin".equals(registrationId)) {
            return (String) attributes.get("picture");
        }
        return null;
    }
}
