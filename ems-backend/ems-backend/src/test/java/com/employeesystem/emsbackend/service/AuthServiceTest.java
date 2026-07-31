package com.employeesystem.emsbackend.service;

import com.employeesystem.emsbackend.dto.RegisterRequestDTO;
import com.employeesystem.emsbackend.entity.Role;
import com.employeesystem.emsbackend.exception.DuplicateResourceException;
import com.employeesystem.emsbackend.repository.EmployeeRepository;
import com.employeesystem.emsbackend.repository.UserRepository;
import com.employeesystem.emsbackend.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private AuthenticationManager authenticationManager;
    @Mock private UserRepository userRepository;
    @Mock private EmployeeRepository employeeRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtUtil jwtUtil;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(authenticationManager, userRepository, employeeRepository, passwordEncoder, jwtUtil);
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
}
