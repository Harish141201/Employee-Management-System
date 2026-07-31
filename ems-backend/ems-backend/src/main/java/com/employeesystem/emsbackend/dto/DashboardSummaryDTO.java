package com.employeesystem.emsbackend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class DashboardSummaryDTO {
    private long totalEmployees;
    private long totalDepartments;
    private long employeesWithoutDepartment;
    private long employeesWithoutManager;
    private List<DepartmentHeadcountDTO> headcountByDepartment;
}
