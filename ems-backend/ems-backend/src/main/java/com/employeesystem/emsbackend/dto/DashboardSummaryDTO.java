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
    private long pendingLeaveRequests;
    private long activeEmployees;
    private long employeesOnLeave;
    private long newEmployeesThisMonth;
    private List<EmployeeResponseDTO> recentEmployees;
    private List<EmployeeStatusCountDTO> employeeStatusBreakdown;
    private List<LeaveRequestResponseDTO> employeesCurrentlyOnLeave;
    private List<DepartmentHeadcountDTO> headcountByDepartment;
}
