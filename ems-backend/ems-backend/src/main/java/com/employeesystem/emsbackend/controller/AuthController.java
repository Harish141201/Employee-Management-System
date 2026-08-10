package com.employeesystem.emsbackend.controller;

import com.employeesystem.emsbackend.dto.ChangePasswordDTO;
import com.employeesystem.emsbackend.dto.LoginRequestDTO;
import com.employeesystem.emsbackend.dto.LoginResponseDTO;
import com.employeesystem.emsbackend.dto.RefreshRequestDTO;
import com.employeesystem.emsbackend.dto.RefreshResponseDTO;
import com.employeesystem.emsbackend.dto.RegisterRequestDTO;
import com.employeesystem.emsbackend.entity.User;
import com.employeesystem.emsbackend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(@Valid @RequestBody LoginRequestDTO request) {
        return ResponseEntity.ok(authService.login(request));
    }

    // Public — the whole point is exchanging a still-valid refresh token
    // for a new access token when the old access token has already
    // expired, so this can't require a valid access token to call.
    @PostMapping("/refresh")
    public ResponseEntity<RefreshResponseDTO> refresh(@Valid @RequestBody RefreshRequestDTO request) {
        return ResponseEntity.ok(authService.refresh(request));
    }

    // Also public, and deliberately not tied to the access token — logout
    // should work even if the access token already expired, since that's
    // exactly when a stale session most needs cleaning up. It's scoped by
    // the refresh token value itself, not by who's "currently authenticated".
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@Valid @RequestBody RefreshRequestDTO request) {
        authService.logout(request.getRefreshToken());
        return ResponseEntity.noContent().build();
    }

    // Only an ADMIN can create new accounts — there is no public self-registration
    // endpoint, since this is an internal HR system, not a consumer app.
    @PostMapping("/register")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> register(@Valid @RequestBody RegisterRequestDTO request) {
        authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PutMapping("/change-password")
    public ResponseEntity<Void> changePassword(@AuthenticationPrincipal User currentUser,
                                                @Valid @RequestBody ChangePasswordDTO request) {
        authService.changePassword(currentUser.getUsername(), request);
        return ResponseEntity.noContent().build();
    }
}
