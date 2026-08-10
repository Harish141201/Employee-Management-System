package com.employeesystem.emsbackend.controller;

import com.employeesystem.emsbackend.dto.LeaveDecisionDTO;
import com.employeesystem.emsbackend.dto.LeaveRequestCreateDTO;
import com.employeesystem.emsbackend.dto.LeaveRequestResponseDTO;
import com.employeesystem.emsbackend.entity.LeaveStatus;
import com.employeesystem.emsbackend.entity.Role;
import com.employeesystem.emsbackend.entity.User;
import com.employeesystem.emsbackend.exception.ResourceNotFoundException;
import com.employeesystem.emsbackend.service.LeaveRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/leave")
@RequiredArgsConstructor
public class LeaveController {

    private final LeaveRequestService leaveRequestService;

    // Anyone with a linked employee record can apply — leave requests aren't
    // an HR/Admin-only concept, they're something every employee does.
    @PostMapping
    public ResponseEntity<LeaveRequestResponseDTO> applyForLeave(@AuthenticationPrincipal User currentUser,
                                                                   @Valid @RequestBody LeaveRequestCreateDTO request) {
        Long employeeId = requireLinkedEmployeeId(currentUser);
        return ResponseEntity.ok(leaveRequestService.applyForLeave(employeeId, request));
    }

    @GetMapping("/me")
    public ResponseEntity<List<LeaveRequestResponseDTO>> getMyLeaveRequests(@AuthenticationPrincipal User currentUser) {
        Long employeeId = requireLinkedEmployeeId(currentUser);
        return ResponseEntity.ok(leaveRequestService.getMyLeaveRequests(employeeId));
    }

    // Requests from the current user's direct reports. Not role-gated —
    // the query itself only returns rows where employee.manager == you, so
    // someone who manages nobody just gets an empty list. The data scoping
    // *is* the access control here.
    @GetMapping("/team")
    public ResponseEntity<List<LeaveRequestResponseDTO>> getTeamLeaveRequests(@AuthenticationPrincipal User currentUser) {
        Long employeeId = requireLinkedEmployeeId(currentUser);
        return ResponseEntity.ok(leaveRequestService.getTeamLeaveRequests(employeeId));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<List<LeaveRequestResponseDTO>> getAllLeaveRequests(
            @RequestParam(required = false) LeaveStatus status) {
        return ResponseEntity.ok(leaveRequestService.getAllLeaveRequests(status));
    }

    @PutMapping("/{id}/decision")
    public ResponseEntity<LeaveRequestResponseDTO> decide(@AuthenticationPrincipal User currentUser,
                                                            @PathVariable Long id,
                                                            @Valid @RequestBody LeaveDecisionDTO decision) {
        Long employeeId = requireLinkedEmployeeId(currentUser);
        boolean isAdminOrHr = currentUser.getRole() == Role.ADMIN || currentUser.getRole() == Role.HR;
        return ResponseEntity.ok(leaveRequestService.decideOnLeaveRequest(id, employeeId, isAdminOrHr, decision));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancel(@AuthenticationPrincipal User currentUser, @PathVariable Long id) {
        Long employeeId = requireLinkedEmployeeId(currentUser);
        boolean isAdmin = currentUser.getRole() == Role.ADMIN;
        leaveRequestService.cancelLeaveRequest(id, employeeId, isAdmin);
        return ResponseEntity.noContent().build();
    }

    private Long requireLinkedEmployeeId(User currentUser) {
        if (currentUser.getEmployee() == null) {
            throw new ResourceNotFoundException("This account is not linked to an employee record");
        }
        return currentUser.getEmployee().getId();
    }
}
