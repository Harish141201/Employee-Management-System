package com.employeesystem.emsbackend.service;

import com.employeesystem.emsbackend.dto.EmployeeRequestDTO;
import com.employeesystem.emsbackend.entity.Employee;
import com.employeesystem.emsbackend.exception.DuplicateResourceException;
import com.employeesystem.emsbackend.exception.ResourceNotFoundException;
import com.employeesystem.emsbackend.mapper.EmployeeMapper;
import com.employeesystem.emsbackend.repository.DepartmentRepository;
import com.employeesystem.emsbackend.repository.EmployeeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
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

    private EmployeeMapper employeeMapper;
    private EmployeeService employeeService;

    @BeforeEach
    void setUp() {
        employeeMapper = new EmployeeMapper();
        employeeService = new EmployeeService(employeeRepository, departmentRepository, employeeMapper);
    }

    private EmployeeRequestDTO validRequest() {
        return new EmployeeRequestDTO("Harish", "Guptha", "harish@example.com", null, null);
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
    void updateEmployee_rejectsSettingEmployeeAsTheirOwnManager() {
        Employee existing = new Employee();
        existing.setId(5L);
        existing.setEmail("harish@example.com");
        when(employeeRepository.findById(5L)).thenReturn(Optional.of(existing));
        when(employeeRepository.findByEmail("harish@example.com")).thenReturn(existing);

        EmployeeRequestDTO request = new EmployeeRequestDTO("Harish", "Guptha", "harish@example.com", null, 5L);

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

        EmployeeRequestDTO request = new EmployeeRequestDTO("Harish", "Guptha", "taken@example.com", null, null);

        assertThatThrownBy(() -> employeeService.updateEmployee(5L, request))
                .isInstanceOf(DuplicateResourceException.class);
    }
}
