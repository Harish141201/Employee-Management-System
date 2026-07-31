package com.employeesystem.emsbackend.service;

import com.employeesystem.emsbackend.dto.DepartmentRequestDTO;
import com.employeesystem.emsbackend.dto.DepartmentResponseDTO;
import com.employeesystem.emsbackend.entity.Department;
import com.employeesystem.emsbackend.exception.DuplicateResourceException;
import com.employeesystem.emsbackend.exception.ResourceNotFoundException;
import com.employeesystem.emsbackend.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DepartmentService {

    private final DepartmentRepository departmentRepository;

    @Transactional
    public DepartmentResponseDTO createDepartment(DepartmentRequestDTO request) {
        if (departmentRepository.existsByNameIgnoreCase(request.getName())) {
            throw new DuplicateResourceException("Department '" + request.getName() + "' already exists");
        }
        Department department = new Department();
        department.setName(request.getName());
        department.setDescription(request.getDescription());
        return toResponse(departmentRepository.save(department));
    }

    public List<DepartmentResponseDTO> getAllDepartments() {
        return departmentRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public DepartmentResponseDTO getDepartmentById(Long id) {
        return toResponse(getDepartmentOrThrow(id));
    }

    @Transactional
    public DepartmentResponseDTO updateDepartment(Long id, DepartmentRequestDTO request) {
        Department department = getDepartmentOrThrow(id);
        department.setName(request.getName());
        department.setDescription(request.getDescription());
        return toResponse(departmentRepository.save(department));
    }

    @Transactional
    public void deleteDepartment(Long id) {
        if (!departmentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Department with ID " + id + " not found");
        }
        departmentRepository.deleteById(id);
    }

    private Department getDepartmentOrThrow(Long id) {
        return departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department with ID " + id + " not found"));
    }

    private DepartmentResponseDTO toResponse(Department department) {
        return new DepartmentResponseDTO(department.getId(), department.getName(), department.getDescription());
    }
}
