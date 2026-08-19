package com.employeesystem.emsbackend.service;

import com.employeesystem.emsbackend.dto.AdminResetPasswordDTO;
import com.employeesystem.emsbackend.dto.UserManagementUpdateDTO;
import com.employeesystem.emsbackend.entity.Employee;
import com.employeesystem.emsbackend.entity.Role;
import com.employeesystem.emsbackend.entity.User;
import com.employeesystem.emsbackend.exception.DuplicateResourceException;
import com.employeesystem.emsbackend.exception.ResourceNotFoundException;
import com.employeesystem.emsbackend.repository.EmployeeRepository;
import com.employeesystem.emsbackend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserManagementServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private EmployeeRepository employeeRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private AuditLogService auditLogService;

    private UserManagementService userManagementService;

    @BeforeEach
    void setUp() {
        userManagementService = new UserManagementService(userRepository, employeeRepository, passwordEncoder, auditLogService);
    }

    private User user(long id, Role role, boolean enabled) {
        User user = new User();
        user.setId(id);
        user.setUsername("user" + id);
        user.setRole(role);
        user.setEnabled(enabled);
        return user;
    }

    @Test
    void update_rejectsAnAdminDisablingTheirOwnAccount() {
        User self = user(1L, Role.ADMIN, true);
        when(userRepository.findById(1L)).thenReturn(Optional.of(self));

        UserManagementUpdateDTO request = new UserManagementUpdateDTO();
        request.setRole(Role.ADMIN);
        request.setEnabled(false);

        assertThatThrownBy(() -> userManagementService.update(1L, request, self))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("cannot disable your own account");
        verify(userRepository, never()).save(any());
    }

    @Test
    void update_allowsAnAdminDisablingSomeoneElsesAccount() {
        User target = user(2L, Role.EMPLOYEE, true);
        User admin = user(1L, Role.ADMIN, true);
        when(userRepository.findById(2L)).thenReturn(Optional.of(target));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserManagementUpdateDTO request = new UserManagementUpdateDTO();
        request.setRole(Role.EMPLOYEE);
        request.setEnabled(false);

        var response = userManagementService.update(2L, request, admin);

        assertThat(response.isEnabled()).isFalse();
        verify(auditLogService).record(eq(admin), eq("USER_UPDATED"), eq("USER"), eq(2L), any());
    }

    @Test
    void update_rejectsLinkingAnEmployeeAlreadyLinkedToAnotherAccount() {
        User target = user(2L, Role.EMPLOYEE, true);
        User admin = user(1L, Role.ADMIN, true);
        when(userRepository.findById(2L)).thenReturn(Optional.of(target));
        when(userRepository.existsByEmployeeId(50L)).thenReturn(true);

        UserManagementUpdateDTO request = new UserManagementUpdateDTO();
        request.setRole(Role.EMPLOYEE);
        request.setEnabled(true);
        request.setEmployeeId(50L);

        assertThatThrownBy(() -> userManagementService.update(2L, request, admin))
                .isInstanceOf(DuplicateResourceException.class);
        verify(userRepository, never()).save(any());
    }

    @Test
    void update_linksANewEmployeeWhenNotAlreadyTaken() {
        User target = user(2L, Role.EMPLOYEE, true);
        User admin = user(1L, Role.ADMIN, true);
        Employee employee = new Employee();
        employee.setId(50L);
        employee.setFirstName("Ava");
        employee.setLastName("Stone");
        when(userRepository.findById(2L)).thenReturn(Optional.of(target));
        when(userRepository.existsByEmployeeId(50L)).thenReturn(false);
        when(employeeRepository.findById(50L)).thenReturn(Optional.of(employee));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserManagementUpdateDTO request = new UserManagementUpdateDTO();
        request.setRole(Role.EMPLOYEE);
        request.setEnabled(true);
        request.setEmployeeId(50L);

        var response = userManagementService.update(2L, request, admin);

        assertThat(response.getEmployeeId()).isEqualTo(50L);
        assertThat(response.getEmployeeName()).isEqualTo("Ava Stone");
    }

    @Test
    void update_throwsNotFoundForAnUnknownUser() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());
        User admin = user(1L, Role.ADMIN, true);
        UserManagementUpdateDTO request = new UserManagementUpdateDTO();
        request.setRole(Role.EMPLOYEE);

        assertThatThrownBy(() -> userManagementService.update(99L, request, admin))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void resetPassword_encodesTheNewPasswordAndAuditsTheAction() {
        User target = user(2L, Role.EMPLOYEE, true);
        User admin = user(1L, Role.ADMIN, true);
        when(userRepository.findById(2L)).thenReturn(Optional.of(target));
        when(passwordEncoder.encode("NewPassw0rd")).thenReturn("encoded-hash");

        AdminResetPasswordDTO request = new AdminResetPasswordDTO();
        request.setNewPassword("NewPassw0rd");

        userManagementService.resetPassword(2L, request, admin);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertThat(captor.getValue().getPassword()).isEqualTo("encoded-hash");
        verify(auditLogService).record(eq(admin), eq("PASSWORD_RESET"), eq("USER"), eq(2L), any());
    }

    @Test
    void resetPassword_throwsNotFoundForAnUnknownUser() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());
        AdminResetPasswordDTO request = new AdminResetPasswordDTO();
        request.setNewPassword("NewPassw0rd");

        assertThatThrownBy(() -> userManagementService.resetPassword(99L, request, user(1L, Role.ADMIN, true)))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
