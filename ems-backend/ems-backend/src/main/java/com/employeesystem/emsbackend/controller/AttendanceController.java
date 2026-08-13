package com.employeesystem.emsbackend.controller;

import com.employeesystem.emsbackend.dto.AttendanceResponseDTO;
import com.employeesystem.emsbackend.entity.User;
import com.employeesystem.emsbackend.exception.ResourceNotFoundException;
import com.employeesystem.emsbackend.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class AttendanceController {
    private final AttendanceService attendanceService;

    @PostMapping("/check-in")
    public ResponseEntity<AttendanceResponseDTO> checkIn(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(attendanceService.checkIn(employeeId(user)));
    }

    @PostMapping("/check-out")
    public ResponseEntity<AttendanceResponseDTO> checkOut(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(attendanceService.checkOut(employeeId(user)));
    }

    @GetMapping("/me")
    public ResponseEntity<List<AttendanceResponseDTO>> mine(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(attendanceService.getMyAttendance(employeeId(user)));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<List<AttendanceResponseDTO>> all(
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        return ResponseEntity.ok(attendanceService.getAllAttendance(employeeId, fromDate, toDate));
    }

    private Long employeeId(User user) {
        if (user.getEmployee() == null) throw new ResourceNotFoundException("This account is not linked to an employee record");
        return user.getEmployee().getId();
    }
}
