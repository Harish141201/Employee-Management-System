package com.employeesystem.emsbackend.service;

import com.employeesystem.emsbackend.dto.LoginRequestDTO;
import com.employeesystem.emsbackend.dto.RefreshRequestDTO;
import com.employeesystem.emsbackend.dto.RegisterRequestDTO;
import com.employeesystem.emsbackend.entity.RefreshToken;
import com.employeesystem.emsbackend.entity.Role;
import com.employeesystem.emsbackend.entity.User;
import com.employeesystem.emsbackend.exception.DuplicateResourceException;
import com.employeesystem.emsbackend.repository.EmployeeRepository;
import com.employeesystem.emsbackend.repository.RefreshTokenRepository;
import com.employeesystem.emsbackend.repository.UserRepository;
import com.employeesystem.emsbackend.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private AuthenticationManager authenticationManager;
    @Mock private UserRepository userRepository;
    @Mock private EmployeeRepository employeeRepository;
    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtUtil jwtUtil;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(authenticationManager, userRepository, employeeRepository,
                refreshTokenRepository, passwordEncoder, jwtUtil);
        // @Value fields aren't populated outside a Spring context — set directly for the tests that need it.
        ReflectionTestUtils.setField(authService, "refreshExpirationMs", 604800000L);
    }

    @Test
    void register_throwsWhenUsernameAlreadyTaken() {
        when(userRepository.existsByUsername("hr_jane")).thenReturn(true);

        RegisterRequestDTO request = new RegisterRequestDTO();
        request.setUsername("hr_jane");
        request.setPassword("strongPassword123");
        request.setRole(Role.HR);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(DuplicateResourceException.class);

        verify(userRepository, never()).save(any());
    }

    @Test
    void register_hashesPasswordBeforeSaving() {
        when(userRepository.existsByUsername("hr_jane")).thenReturn(false);
        when(passwordEncoder.encode("strongPassword123")).thenReturn("hashed-value");

        RegisterRequestDTO request = new RegisterRequestDTO();
        request.setUsername("hr_jane");
        request.setPassword("strongPassword123");
        request.setRole(Role.HR);

        authService.register(request);

        verify(passwordEncoder).encode("strongPassword123");
        verify(userRepository).save(argThat(user -> "hashed-value".equals(user.getPassword())));
    }

    @Test
    void refresh_throwsWhenTokenNotFound() {
        when(refreshTokenRepository.findByToken("bogus-token")).thenReturn(Optional.empty());

        RefreshRequestDTO request = new RefreshRequestDTO();
        request.setRefreshToken("bogus-token");

        assertThatThrownBy(() -> authService.refresh(request))
                .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    void refresh_throwsAndDeletesTokenWhenExpired() {
        RefreshToken expired = new RefreshToken();
        expired.setToken("old-token");
        expired.setExpiryDate(Instant.now().minusSeconds(60)); // 1 minute in the past

        when(refreshTokenRepository.findByToken("old-token")).thenReturn(Optional.of(expired));

        RefreshRequestDTO request = new RefreshRequestDTO();
        request.setRefreshToken("old-token");

        assertThatThrownBy(() -> authService.refresh(request))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessageContaining("expired");

        verify(refreshTokenRepository).delete(expired);
    }

    @Test
    void refresh_issuesNewAccessTokenWhenTokenIsValid() {
        User user = new User();
        user.setId(1L);
        user.setUsername("hr_jane");
        user.setRole(Role.HR);

        RefreshToken valid = new RefreshToken();
        valid.setToken("good-token");
        valid.setUser(user);
        valid.setExpiryDate(Instant.now().plusSeconds(3600));

        when(refreshTokenRepository.findByToken("good-token")).thenReturn(Optional.of(valid));
        when(jwtUtil.generateToken(user, null)).thenReturn("new-access-token");

        RefreshRequestDTO request = new RefreshRequestDTO();
        request.setRefreshToken("good-token");

        var result = authService.refresh(request);

        assertThat(result.getToken()).isEqualTo("new-access-token");
    }

    @Test
    void login_issuesAndSavesARefreshTokenOnSuccess() {
        User user = new User();
        user.setId(1L);
        user.setUsername("hr_jane");
        user.setRole(Role.HR);

        when(userRepository.findByUsername("hr_jane")).thenReturn(Optional.of(user));
        when(jwtUtil.generateToken(user, null)).thenReturn("access-token");

        var request = new LoginRequestDTO();
        request.setUsername("hr_jane");
        request.setPassword("whatever");

        var result = authService.login(request);

        assertThat(result.getToken()).isEqualTo("access-token");
        assertThat(result.getRefreshToken()).isNotBlank();
        verify(refreshTokenRepository).deleteByUserId(1L); // old session invalidated first
        verify(refreshTokenRepository).save(argThat(rt -> rt.getToken().equals(result.getRefreshToken())));
    }

    @Test
    void logout_isIdempotentWhenTokenDoesNotExist() {
        when(refreshTokenRepository.findByToken("already-gone")).thenReturn(Optional.empty());

        authService.logout("already-gone"); // should not throw

        verify(refreshTokenRepository, never()).delete(any());
    }
}
