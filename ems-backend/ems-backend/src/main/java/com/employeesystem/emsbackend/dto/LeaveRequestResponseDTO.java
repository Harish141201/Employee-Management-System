package com.employeesystem.emsbackend.dto;

import com.employeesystem.emsbackend.entity.LeaveStatus;
import com.employeesystem.emsbackend.entity.LeaveType;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class LeaveRequestResponseDTO {
    private Long id;
    private Long employeeId;
    private String employeeName;
    private LeaveType leaveType;
    private LocalDate startDate;
    private LocalDate endDate;
    private long numberOfDays;
    private String reason;
    private LeaveStatus status;
    private LocalDateTime appliedAt;
    private String decidedByName;
    private String decisionNote;
    private LocalDateTime decidedAt;
}
