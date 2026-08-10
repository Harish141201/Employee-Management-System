package com.employeesystem.emsbackend.service;

import com.employeesystem.emsbackend.dto.ChangePasswordDTO;
import com.employeesystem.emsbackend.dto.LoginRequestDTO;
import com.employeesystem.emsbackend.dto.LoginResponseDTO;
import com.employeesystem.emsbackend.dto.RefreshRequestDTO;
import com.employeesystem.emsbackend.dto.RefreshResponseDTO;
import com.employeesystem.emsbackend.dto.RegisterRequestDTO;
import com.employeesystem.emsbackend.entity.Employee;
import com.employeesystem.emsbackend.entity.RefreshToken;
import com.employeesystem.emsbackend.entity.User;
import com.employeesystem.emsbackend.exception.DuplicateResourceException;
import com.employeesystem.emsbackend.exception.ResourceNotFoundException;
import com.employeesystem.emsbackend.repository.EmployeeRepository;
import com.employeesystem.emsbackend.repository.RefreshTokenRepository;
import com.employeesystem.emsbackend.repository.UserRepository;
import com.employeesystem.emsbackend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Value("${app.jwt.refresh-expiration-ms:604800000}") // 7 days default
    private long refreshExpirationMs;

    @Transactional
    public LoginResponseDTO login(LoginRequestDTO request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));
        } catch (BadCredentialsException ex) {
            // Deliberately vague — don't reveal whether it was the username
            // or password that was wrong.
            throw new BadCredentialsException("Invalid username or password");
        }

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new BadCredentialsException("Invalid username or password"));

        Long employeeId = user.getEmployee() != null ? user.getEmployee().getId() : null;
        String employeeName = user.getEmployee() != null
                ? user.getEmployee().getFirstName() + " " + user.getEmployee().getLastName()
                : null;
        String accessToken = jwtUtil.generateToken(user, employeeId);
        String refreshToken = issueRefreshToken(user);

        return new LoginResponseDTO(accessToken, refreshToken, user.getUsername(), user.getRole().name(), employeeId, employeeName);
    }

    // Exchanges a valid, unexpired refresh token for a new access token.
    // Deliberately does NOT re-issue a new refresh token here (no
    // rotation) — that's a further hardening step (detecting reuse of an
    // old rotated-out token as a signal of theft) that adds real
    // complexity for a benefit this project's threat model doesn't
    // strongly need yet. Documented as a known simplification, not an
    // oversight.
    @Transactional
    public RefreshResponseDTO refresh(RefreshRequestDTO request) {
        RefreshToken stored = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new BadCredentialsException("Invalid refresh token"));

        if (stored.getExpiryDate().isBefore(Instant.now())) {
            refreshTokenRepository.delete(stored);
            throw new BadCredentialsException("Refresh token has expired — please log in again");
        }

        User user = stored.getUser();
        Long employeeId = user.getEmployee() != null ? user.getEmployee().getId() : null;
        String newAccessToken = jwtUtil.generateToken(user, employeeId);

        return new RefreshResponseDTO(newAccessToken);
    }

    // Idempotent by design — logging out with an already-invalid or
    // already-used refresh token should still look like a successful
    // logout from the client's point of view, not an error.
    @Transactional
    public void logout(String refreshTokenValue) {
        refreshTokenRepository.findByToken(refreshTokenValue).ifPresent(refreshTokenRepository::delete);
    }

    private String issueRefreshToken(User user) {
        // One active refresh token per user — see RefreshTokenRepository.
        refreshTokenRepository.deleteByUserId(user.getId());

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setToken(UUID.randomUUID().toString());
        refreshToken.setUser(user);
        refreshToken.setExpiryDate(Instant.now().plusMillis(refreshExpirationMs));
        refreshTokenRepository.save(refreshToken);

        return refreshToken.getToken();
    }

    public void register(RegisterRequestDTO request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new DuplicateResourceException("Username " + request.getUsername() + " is already taken");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());

        if (request.getEmployeeId() != null) {
            Employee employee = employeeRepository.findById(request.getEmployeeId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Employee with ID " + request.getEmployeeId() + " not found"));
            user.setEmployee(employee);
        }

        userRepository.save(user);
    }

    // username comes from the authenticated principal (set by the caller
    // in the controller), never from the request body — otherwise nothing
    // would stop one user from changing another user's password by just
    // editing the JSON payload.
    @Transactional
    public void changePassword(String username, ChangePasswordDTO request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadCredentialsException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
}
