package com.employeesystem.emsbackend.service;

import com.employeesystem.emsbackend.dto.EmployeeRequestDTO;
import com.employeesystem.emsbackend.entity.Employee;
import com.employeesystem.emsbackend.exception.DuplicateResourceException;
import com.employeesystem.emsbackend.exception.ResourceInUseException;
import com.employeesystem.emsbackend.exception.ResourceNotFoundException;
import com.employeesystem.emsbackend.mapper.EmployeeMapper;
import com.employeesystem.emsbackend.repository.DepartmentRepository;
import com.employeesystem.emsbackend.repository.EmployeeRepository;
import com.employeesystem.emsbackend.repository.LeaveRequestRepository;
import com.employeesystem.emsbackend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Pure Mockito unit tests — no Spring context, no database. These target
 * the actual business rules (duplicate email, self-management, not-found)
 * rather than re-testing framework plumbing.
 */
@ExtendWith(MockitoExtension.class)
class EmployeeServiceTest {

    @Mock
    private EmployeeRepository employeeRepository;
    @Mock
    private DepartmentRepository departmentRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private LeaveRequestRepository leaveRequestRepository;

    private EmployeeMapper employeeMapper;
    private EmployeeService employeeService;

    @BeforeEach
    void setUp() {
        employeeMapper = new EmployeeMapper();
        employeeService = new EmployeeService(employeeRepository, departmentRepository, userRepository, leaveRequestRepository, employeeMapper);
    }

    private EmployeeRequestDTO validRequest() {
        return EmployeeRequestDTO.builder()
                .firstName("Harish")
                .lastName("Guptha")
                .email("harish@example.com")
                .build();
    }

    @Test
    void addEmployee_throwsWhenEmailAlreadyExists() {
        Employee existing = new Employee();
        existing.setId(1L);
        existing.setEmail("harish@example.com");
        when(employeeRepository.findByEmail("harish@example.com")).thenReturn(existing);

        assertThatThrownBy(() -> employeeService.addEmployee(validRequest()))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("harish@example.com");

        verify(employeeRepository, never()).save(any());
    }

    @Test
    void addEmployee_savesSuccessfullyWhenEmailIsUnique() {
        when(employeeRepository.findByEmail("harish@example.com")).thenReturn(null);
        when(employeeRepository.save(any(Employee.class))).thenAnswer(invocation -> {
            Employee e = invocation.getArgument(0);
            e.setId(42L);
            return e;
        });

        var result = employeeService.addEmployee(validRequest());

        assertThat(result.getId()).isEqualTo(42L);
        assertThat(result.getFirstName()).isEqualTo("Harish");
        verify(employeeRepository).save(any(Employee.class));
    }

    @Test
    void findEmployeeById_throwsWhenNotFound() {
        when(employeeRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> employeeService.findEmployeeById(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void deleteEmployeeById_throwsWhenNotFound() {
        when(employeeRepository.existsById(99L)).thenReturn(false);

        assertThatThrownBy(() -> employeeService.deleteEmployeeById(99L))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(employeeRepository, never()).deleteById(any());
    }

    @Test
    void deleteEmployeeById_blockedWhenEmployeeHasDirectReports() {
        when(employeeRepository.existsById(1L)).thenReturn(true);
        when(employeeRepository.countByManagerId(1L)).thenReturn(2L);
        when(leaveRequestRepository.countByEmployeeId(1L)).thenReturn(0L);
        when(userRepository.existsByEmployeeId(1L)).thenReturn(false);

        assertThatThrownBy(() -> employeeService.deleteEmployeeById(1L))
                .isInstanceOf(ResourceInUseException.class)
                .hasMessageContaining("2 direct reports");

        verify(employeeRepository, never()).deleteById(any());
    }

    @Test
    void deleteEmployeeById_succeedsWhenNoDependentsExist() {
        when(employeeRepository.existsById(1L)).thenReturn(true);
        when(employeeRepository.countByManagerId(1L)).thenReturn(0L);
        when(leaveRequestRepository.countByEmployeeId(1L)).thenReturn(0L);
        when(userRepository.existsByEmployeeId(1L)).thenReturn(false);

        employeeService.deleteEmployeeById(1L);

        verify(employeeRepository).deleteById(1L);
    }

    @Test
    void updateEmployee_rejectsSettingEmployeeAsTheirOwnManager() {
        Employee existing = new Employee();
        existing.setId(5L);
        existing.setEmail("harish@example.com");
        when(employeeRepository.findById(5L)).thenReturn(Optional.of(existing));
        when(employeeRepository.findByEmail("harish@example.com")).thenReturn(existing);

        EmployeeRequestDTO request = EmployeeRequestDTO.builder()
                .firstName("Harish")
                .lastName("Guptha")
                .email("harish@example.com")
                .managerId(5L)
                .build();

        assertThatThrownBy(() -> employeeService.updateEmployee(5L, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("own manager");
    }

    @Test
    void updateEmployee_throwsWhenNewEmailBelongsToSomeoneElse() {
        Employee existing = new Employee();
        existing.setId(5L);
        existing.setEmail("old@example.com");

        Employee someoneElse = new Employee();
        someoneElse.setId(6L);
        someoneElse.setEmail("taken@example.com");

        when(employeeRepository.findById(5L)).thenReturn(Optional.of(existing));
        when(employeeRepository.findByEmail("taken@example.com")).thenReturn(someoneElse);

        EmployeeRequestDTO request = EmployeeRequestDTO.builder()
                .firstName("Harish")
                .lastName("Guptha")
                .email("taken@example.com")
                .build();

        assertThatThrownBy(() -> employeeService.updateEmployee(5L, request))
                .isInstanceOf(DuplicateResourceException.class);
    }
}
