package com.employeesystem.emsbackend.service;

import com.employeesystem.emsbackend.dto.DashboardSummaryDTO;
import com.employeesystem.emsbackend.dto.EmployeeResponseDTO;
import com.employeesystem.emsbackend.dto.EmployeeStatusCountDTO;
import com.employeesystem.emsbackend.dto.LeaveRequestResponseDTO;
import com.employeesystem.emsbackend.entity.LeaveStatus;
import com.employeesystem.emsbackend.repository.DepartmentRepository;
import com.employeesystem.emsbackend.repository.EmployeeRepository;
import com.employeesystem.emsbackend.repository.LeaveRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final com.employeesystem.emsbackend.mapper.EmployeeMapper employeeMapper;
    private final com.employeesystem.emsbackend.mapper.LeaveRequestMapper leaveRequestMapper;

    public DashboardSummaryDTO getSummary() {
        long totalEmployees = employeeRepository.count();
        long totalDepartments = departmentRepository.count();

        long withoutDepartment = employeeRepository.count(
                (root, query, cb) -> cb.isNull(root.get("department")));
        long withoutManager = employeeRepository.count(
                (root, query, cb) -> cb.isNull(root.get("manager")));

        long pendingLeave = leaveRequestRepository.countByStatus(LeaveStatus.PENDING);
        long activeEmployees = employeeRepository.countByStatus(com.employeesystem.emsbackend.entity.EmployeeStatus.ACTIVE);
        long employeesOnLeave = leaveRequestRepository.countActiveOnDate(LeaveStatus.APPROVED, LocalDate.now());
        long newEmployeesThisMonth = employeeRepository.countByJoiningDateGreaterThanEqual(YearMonth.now().atDay(1));
        List<EmployeeResponseDTO> recentEmployees = employeeRepository.findTop5ByJoiningDateIsNotNullOrderByJoiningDateDesc()
                .stream().map(employeeMapper::toResponseDto).toList();
        List<EmployeeStatusCountDTO> employeeStatusBreakdown = employeeRepository.countByStatusGroup().stream()
                .map(row -> new EmployeeStatusCountDTO((com.employeesystem.emsbackend.entity.EmployeeStatus) row[0], ((Number) row[1]).longValue()))
                .toList();
        List<LeaveRequestResponseDTO> employeesCurrentlyOnLeave = leaveRequestRepository
                .findActiveOnDate(LeaveStatus.APPROVED, LocalDate.now()).stream().limit(5)
                .map(leaveRequestMapper::toResponseDto).toList();

        return new DashboardSummaryDTO(
                totalEmployees,
                totalDepartments,
                withoutDepartment,
                withoutManager,
                pendingLeave,
                activeEmployees,
                employeesOnLeave,
                newEmployeesThisMonth,
                recentEmployees,
                employeeStatusBreakdown,
                employeesCurrentlyOnLeave,
                departmentRepository.findHeadcountByDepartment()
        );
    }
}
