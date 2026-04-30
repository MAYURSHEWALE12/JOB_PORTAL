package com.jobportal.security;

import com.jobportal.entity.User;
import com.jobportal.exception.BadRequestException;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
@RequiredArgsConstructor
@Slf4j
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtUtil jwtUtil;

    @Value("${app.oauth2.frontend-url}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        try {
            OAuth2UserPrincipal principal = (OAuth2UserPrincipal) authentication.getPrincipal();
            User user = principal.getUser();

            String token = jwtUtil.generateToken(user);

            log.info("OAuth2 login successful for user: {} via {}", user.getEmail(), user.getAuthProvider());

            String resolvedFrontendUrl = frontendUrl;


            String redirectUrl = UriComponentsBuilder.fromUriString(resolvedFrontendUrl + "/oauth2/redirect")
                    .queryParam("token", token)
                    .queryParam("userId", user.getId())
                    .queryParam("email", URLEncoder.encode(user.getEmail(), StandardCharsets.UTF_8))
                    .queryParam("firstName", URLEncoder.encode(user.getFirstName(), StandardCharsets.UTF_8))
                    .queryParam("lastName", URLEncoder.encode(user.getLastName(), StandardCharsets.UTF_8))
                    .queryParam("role", user.getRole().toString())
                    .queryParam("profileImageUrl", user.getProfileImageUrl() != null ? URLEncoder.encode(user.getProfileImageUrl(), StandardCharsets.UTF_8) : "")
                    .build().toUriString();

            getRedirectStrategy().sendRedirect(request, response, redirectUrl);
        } catch (Exception e) {
            log.error("OAuth2 login failed: {}", e.getMessage(), e);
            String redirectUrl = UriComponentsBuilder.fromUriString(frontendUrl + "/login")
                    .queryParam("error", URLEncoder.encode("OAuth2 login failed: " + e.getMessage(), StandardCharsets.UTF_8))
                    .build().toUriString();
            getRedirectStrategy().sendRedirect(request, response, redirectUrl);
        }
    }
}
