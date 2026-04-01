package com.jobportal.security;

import com.jobportal.entity.User;
import com.jobportal.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.Collections;
import java.util.Optional;


@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        try {
            // Step 1: Get Authorization header
            String authHeader = request.getHeader("Authorization");

            // Step 2: Check if header exists and has Bearer token
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7); // Remove "Bearer " prefix

                // Step 3: Validate token
                if (jwtUtil.validateToken(token) && !jwtUtil.isTokenExpired(token)) {

                    // Step 4: Extract user info and attach to request
                    Long userId = jwtUtil.extractUserId(token);
                    String email = jwtUtil.extractEmail(token);

                    Optional<User> userOpt = userRepository.findById(userId);
                    if (userOpt.isPresent()) {
                        User user = userOpt.get();
                        
                        // Step 5: Create Spring Security Authentication object
                        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                                user.getEmail(),
                                null,
                                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
                        );
                        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                        // Step 6: Set SecurityContextHolder
                        SecurityContextHolder.getContext().setAuthentication(authentication);

                        // Store user details in request for backwards compatibility with controllers
                        request.setAttribute("userId", user.getId());
                        request.setAttribute("userEmail", user.getEmail());
                        request.setAttribute("userRole", user.getRole());
                        log.debug("Authenticated user in SecurityContext: {}", email);
                    }

                } else {
                    log.warn("Invalid or expired JWT token");
                }
            }

            // Step 5: Always continue the filter chain
            filterChain.doFilter(request, response);

        } catch (Exception e) {
            log.error("JWT filter error: {}", e.getMessage());
            filterChain.doFilter(request, response);
        }
    }
}