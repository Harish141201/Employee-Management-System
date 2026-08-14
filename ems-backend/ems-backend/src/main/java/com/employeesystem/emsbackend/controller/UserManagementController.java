package com.employeesystem.emsbackend.controller;

import com.employeesystem.emsbackend.dto.UserManagementUpdateDTO;
import com.employeesystem.emsbackend.dto.AdminResetPasswordDTO;
import com.employeesystem.emsbackend.dto.UserResponseDTO;
import com.employeesystem.emsbackend.entity.User;
import com.employeesystem.emsbackend.service.UserManagementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class UserManagementController {
    private final UserManagementService userManagementService;

    @GetMapping
    public ResponseEntity<List<UserResponseDTO>> list() {
        return ResponseEntity.ok(userManagementService.list());
    }

    @PutMapping("/{userId}")
    public ResponseEntity<UserResponseDTO> update(@PathVariable Long userId, @Valid @RequestBody UserManagementUpdateDTO request,
                                                  @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(userManagementService.update(userId, request, currentUser));
    }

    @PutMapping("/{userId}/reset-password")
    public ResponseEntity<Void> resetPassword(@PathVariable Long userId, @Valid @RequestBody AdminResetPasswordDTO request, @AuthenticationPrincipal User currentUser) {
        userManagementService.resetPassword(userId, request, currentUser);
        return ResponseEntity.noContent().build();
    }
}
