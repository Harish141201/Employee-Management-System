package com.employeesystem.emsbackend.mapper;

import com.employeesystem.emsbackend.dto.EmployeeRequestDTO;
import com.employeesystem.emsbackend.dto.EmployeeResponseDTO;
import com.employeesystem.emsbackend.entity.Department;
import com.employeesystem.emsbackend.entity.Employee;
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
        employee.setFirstName(dto.getFirstName());
        employee.setLastName(dto.getLastName());
        employee.setEmail(dto.getEmail());
        return employee;
    }

    public void updateEntityFromDto(EmployeeRequestDTO dto, Employee employee) {
        employee.setFirstName(dto.getFirstName());
        employee.setLastName(dto.getLastName());
        employee.setEmail(dto.getEmail());
    }

    public EmployeeResponseDTO toResponseDto(Employee employee) {
        Department department = employee.getDepartment();
        Employee manager = employee.getManager();

        return new EmployeeResponseDTO(
                employee.getId(),
                employee.getFirstName(),
                employee.getLastName(),
                employee.getEmail(),
                department != null ? department.getId() : null,
                department != null ? department.getName() : null,
                manager != null ? manager.getId() : null,
                manager != null ? manager.getFirstName() + " " + manager.getLastName() : null
        );
    }
}
