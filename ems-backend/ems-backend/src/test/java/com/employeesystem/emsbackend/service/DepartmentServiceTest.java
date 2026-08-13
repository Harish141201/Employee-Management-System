package com.employeesystem.emsbackend.service;

import com.employeesystem.emsbackend.dto.DepartmentRequestDTO;
import com.employeesystem.emsbackend.entity.Department;
import com.employeesystem.emsbackend.exception.DuplicateResourceException;
import com.employeesystem.emsbackend.exception.ResourceNotFoundException;
import com.employeesystem.emsbackend.repository.DepartmentRepository;
import com.employeesystem.emsbackend.repository.EmployeeRepository;
import com.employeesystem.emsbackend.repository.LeaveRequestRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DepartmentServiceTest {

    @Mock
    private DepartmentRepository departmentRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private LeaveRequestRepository leaveRequestRepository;

    private DepartmentService departmentService;

    @BeforeEach
    void setUp() {
        departmentService = new DepartmentService(departmentRepository, employeeRepository, leaveRequestRepository);
    }

    @Test
    void createDepartment_throwsWhenNameAlreadyExists() {
        when(departmentRepository.existsByNameIgnoreCase("Engineering")).thenReturn(true);

        DepartmentRequestDTO request = new DepartmentRequestDTO();
        request.setName("Engineering");

        assertThatThrownBy(() -> departmentService.createDepartment(request))
                .isInstanceOf(DuplicateResourceException.class);

        verify(departmentRepository, never()).save(any());
    }

    @Test
    void deleteDepartment_throwsWhenNotFound() {
        when(departmentRepository.existsById(1L)).thenReturn(false);

        assertThatThrownBy(() -> departmentService.deleteDepartment(1L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getDepartmentById_throwsWhenNotFound() {
        when(departmentRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> departmentService.getDepartmentById(1L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
