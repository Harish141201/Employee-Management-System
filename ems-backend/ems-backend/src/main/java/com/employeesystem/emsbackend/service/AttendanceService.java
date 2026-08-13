package com.employeesystem.emsbackend.service;

import com.employeesystem.emsbackend.dto.AttendanceResponseDTO;
import com.employeesystem.emsbackend.entity.Attendance;
import com.employeesystem.emsbackend.entity.Employee;
import com.employeesystem.emsbackend.exception.DuplicateResourceException;
import com.employeesystem.emsbackend.exception.ResourceNotFoundException;
import com.employeesystem.emsbackend.repository.AttendanceRepository;
import com.employeesystem.emsbackend.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AttendanceService {
    private final AttendanceRepository attendanceRepository;
    private final EmployeeRepository employeeRepository;

    @Transactional
    public AttendanceResponseDTO checkIn(Long employeeId) {
        LocalDate today = LocalDate.now();
        if (attendanceRepository.findByEmployeeIdAndAttendanceDate(employeeId, today).isPresent()) {
            throw new DuplicateResourceException("You have already checked in today");
        }
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee with ID " + employeeId + " not found"));
        Attendance attendance = new Attendance();
        attendance.setEmployee(employee);
        attendance.setAttendanceDate(today);
        attendance.setCheckInAt(LocalDateTime.now());
        return toResponse(attendanceRepository.save(attendance));
    }

    @Transactional
    public AttendanceResponseDTO checkOut(Long employeeId) {
        Attendance attendance = attendanceRepository.findByEmployeeIdAndAttendanceDate(employeeId, LocalDate.now())
                .orElseThrow(() -> new ResourceNotFoundException("No check-in record found for today"));
        if (attendance.getCheckOutAt() != null) throw new DuplicateResourceException("You have already checked out today");
        attendance.setCheckOutAt(LocalDateTime.now());
        return toResponse(attendanceRepository.save(attendance));
    }

    public List<AttendanceResponseDTO> getMyAttendance(Long employeeId) {
        return attendanceRepository.findByEmployeeIdOrderByAttendanceDateDesc(employeeId).stream().map(this::toResponse).toList();
    }

    public List<AttendanceResponseDTO> getAllAttendance(Long employeeId, LocalDate fromDate, LocalDate toDate) {
        if (fromDate != null && toDate != null && fromDate.isAfter(toDate)) {
            throw new IllegalArgumentException("From date must be on or before to date");
        }
        return attendanceRepository.findAllFiltered(employeeId, fromDate, toDate).stream().map(this::toResponse).toList();
    }

    private AttendanceResponseDTO toResponse(Attendance attendance) {
        long workedMinutes = attendance.getCheckOutAt() == null ? 0 : Duration.between(attendance.getCheckInAt(), attendance.getCheckOutAt()).toMinutes();
        Employee employee = attendance.getEmployee();
        return new AttendanceResponseDTO(attendance.getId(), employee.getId(), employee.getFirstName() + " " + employee.getLastName(),
                attendance.getAttendanceDate(), attendance.getCheckInAt(), attendance.getCheckOutAt(), attendance.getStatus(), workedMinutes);
    }
}
