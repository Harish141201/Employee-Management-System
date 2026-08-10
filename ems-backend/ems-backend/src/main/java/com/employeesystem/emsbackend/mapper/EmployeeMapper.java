package com.employeesystem.emsbackend.mapper;

import com.employeesystem.emsbackend.dto.EmployeeRequestDTO;
import com.employeesystem.emsbackend.dto.EmployeeResponseDTO;
import com.employeesystem.emsbackend.entity.Department;
import com.employeesystem.emsbackend.entity.Employee;
import com.employeesystem.emsbackend.entity.EmployeeStatus;
import org.springframework.stereotype.Component;

/**
 * Plain-code mapper (no MapStruct) — the entity is small enough that a
 * generated mapper would be overkill. Department/manager resolution
 * (looking them up by id) happens in the service layer, since the mapper
 * has no repository access by design — it only shapes data it's given.
 */
@Component
public class EmployeeMapper {

    public Employee toEntity(EmployeeRequestDTO dto) {
        Employee employee = new Employee();
        applyProfileFields(dto, employee);
        return employee;
    }

    public void updateEntityFromDto(EmployeeRequestDTO dto, Employee employee) {
        applyProfileFields(dto, employee);
    }

    private void applyProfileFields(EmployeeRequestDTO dto, Employee employee) {
        employee.setFirstName(dto.getFirstName());
        employee.setLastName(dto.getLastName());
        employee.setEmail(dto.getEmail());

        employee.setPhone(dto.getPhone());
        employee.setAddress(dto.getAddress());
        employee.setDateOfBirth(dto.getDateOfBirth());
        employee.setGender(dto.getGender());
        employee.setBloodGroup(dto.getBloodGroup());
        employee.setEmergencyContactName(dto.getEmergencyContactName());
        employee.setEmergencyContactPhone(dto.getEmergencyContactPhone());
        employee.setDesignation(dto.getDesignation());
        employee.setEmploymentType(dto.getEmploymentType());
        // Default to ACTIVE rather than letting a form that doesn't send a
        // status silently clear it to null — there's no real case where an
        // employee record should have an "unknown" status.
        employee.setStatus(dto.getStatus() != null ? dto.getStatus() : EmployeeStatus.ACTIVE);
        employee.setSalary(dto.getSalary());
        employee.setJoiningDate(dto.getJoiningDate());
    }

    public EmployeeResponseDTO toResponseDto(Employee employee) {
        Department department = employee.getDepartment();
        Employee manager = employee.getManager();

        return EmployeeResponseDTO.builder()
                .id(employee.getId())
                .firstName(employee.getFirstName())
                .lastName(employee.getLastName())
                .email(employee.getEmail())
                .departmentId(department != null ? department.getId() : null)
                .departmentName(department != null ? department.getName() : null)
                .managerId(manager != null ? manager.getId() : null)
                .managerName(manager != null ? manager.getFirstName() + " " + manager.getLastName() : null)
                .phone(employee.getPhone())
                .address(employee.getAddress())
                .dateOfBirth(employee.getDateOfBirth())
                .gender(employee.getGender())
                .bloodGroup(employee.getBloodGroup())
                .emergencyContactName(employee.getEmergencyContactName())
                .emergencyContactPhone(employee.getEmergencyContactPhone())
                .designation(employee.getDesignation())
                .employmentType(employee.getEmploymentType())
                .status(employee.getStatus())
                .salary(employee.getSalary())
                .joiningDate(employee.getJoiningDate())
                .build();
    }
}
