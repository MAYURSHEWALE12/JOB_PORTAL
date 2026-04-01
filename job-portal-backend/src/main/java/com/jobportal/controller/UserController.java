package com.jobportal.controller;

import com.jobportal.dto.UserDTO;
import com.jobportal.entity.User;
import com.jobportal.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {

    private final UserService userService;

    @Value("${app.avatar.upload-dir}")
    private String uploadDir;

    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(UserDTO.fromEntity(userService.getUserById(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserDTO> updateUser(
            @PathVariable Long id,
            @RequestBody User userDetails) {
        return ResponseEntity.ok(UserDTO.fromEntity(userService.updateUserProfile(id, userDetails)));
    }

    @PostMapping("/{id}/avatar")
    public ResponseEntity<UserDTO> uploadAvatar(
            @PathVariable Long id,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        return ResponseEntity.ok(UserDTO.fromEntity(userService.updateUserProfileImage(id, file, uploadDir)));
    }

    @GetMapping("/avatar/{fileName:.+}")
    public ResponseEntity<org.springframework.core.io.Resource> getAvatar(@PathVariable String fileName) {
        try {
            java.nio.file.Path filePath = java.nio.file.Paths.get(uploadDir).resolve(fileName);
            org.springframework.core.io.Resource resource = new org.springframework.core.io.UrlResource(filePath.toUri());

            if (resource.exists() || resource.isReadable()) {
                return ResponseEntity.ok()
                        .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (java.net.MalformedURLException e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
