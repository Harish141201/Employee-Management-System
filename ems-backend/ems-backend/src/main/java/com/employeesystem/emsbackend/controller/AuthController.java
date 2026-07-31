package com.employeesystem.emsbackend.controller;

import com.employeesystem.emsbackend.dto.LoginRequestDTO;
import com.employeesystem.emsbackend.dto.LoginResponseDTO;
import com.employeesystem.emsbackend.dto.RegisterRequestDTO;
import com.employeesystem.emsbackend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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

    // Only an ADMIN can create new accounts — there is no public self-registration
    // endpoint, since this is an internal HR system, not a consumer app.
    @PostMapping("/register")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> register(@Valid @RequestBody RegisterRequestDTO request) {
        authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
