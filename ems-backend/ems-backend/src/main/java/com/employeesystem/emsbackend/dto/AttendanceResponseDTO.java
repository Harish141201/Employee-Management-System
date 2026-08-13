package com.employeesystem.emsbackend.dto;

import com.employeesystem.emsbackend.entity.AttendanceStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class AttendanceResponseDTO {
    private Long id;
    private Long employeeId;
    private String employeeName;
    private LocalDate attendanceDate;
    private LocalDateTime checkInAt;
    private LocalDateTime checkOutAt;
    private AttendanceStatus status;
    private long workedMinutes;
}
