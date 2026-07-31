package com.employeesystem.emsbackend.service;

import com.employeesystem.emsbackend.dto.DashboardSummaryDTO;
import com.employeesystem.emsbackend.repository.DepartmentRepository;
import com.employeesystem.emsbackend.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;

    public DashboardSummaryDTO getSummary() {
        long totalEmployees = employeeRepository.count();
        long totalDepartments = departmentRepository.count();

        long withoutDepartment = employeeRepository.count(
                (root, query, cb) -> cb.isNull(root.get("department")));
        long withoutManager = employeeRepository.count(
                (root, query, cb) -> cb.isNull(root.get("manager")));

        return new DashboardSummaryDTO(
                totalEmployees,
                totalDepartments,
                withoutDepartment,
                withoutManager,
                departmentRepository.findHeadcountByDepartment()
        );
    }
}
