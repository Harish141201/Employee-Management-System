package com.employeesystem.emsbackend.service;

import com.employeesystem.emsbackend.dto.LeaveDecisionDTO;
import com.employeesystem.emsbackend.dto.LeaveRequestCreateDTO;
import com.employeesystem.emsbackend.dto.LeaveRequestResponseDTO;
import com.employeesystem.emsbackend.entity.*;
import com.employeesystem.emsbackend.exception.ResourceNotFoundException;
import com.employeesystem.emsbackend.mapper.LeaveRequestMapper;
import com.employeesystem.emsbackend.repository.EmployeeRepository;
import com.employeesystem.emsbackend.repository.LeaveRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LeaveRequestService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final EmployeeRepository employeeRepository;
    private final LeaveRequestMapper leaveRequestMapper;
    private final NotificationService notificationService;

    private static final List<LeaveStatus> ACTIVE_STATUSES = List.of(LeaveStatus.PENDING, LeaveStatus.APPROVED);

    @Transactional
    public LeaveRequestResponseDTO applyForLeave(Long employeeId, LeaveRequestCreateDTO request) {
        Employee employee = getEmployeeOrThrow(employeeId);

        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new IllegalArgumentException("End date cannot be before start date");
        }

        boolean overlaps = !leaveRequestRepository.findOverlapping(
                employeeId, ACTIVE_STATUSES, request.getStartDate(), request.getEndDate()).isEmpty();
        if (overlaps) {
            throw new IllegalArgumentException(
                    "You already have a pending or approved leave request that overlaps these dates");
        }

        LeaveRequest leaveRequest = new LeaveRequest();
        leaveRequest.setEmployee(employee);
        leaveRequest.setLeaveType(request.getLeaveType());
        leaveRequest.setStartDate(request.getStartDate());
        leaveRequest.setEndDate(request.getEndDate());
        leaveRequest.setReason(request.getReason());
        leaveRequest.setStatus(LeaveStatus.PENDING);

        return leaveRequestMapper.toResponseDto(leaveRequestRepository.save(leaveRequest));
    }

    public List<LeaveRequestResponseDTO> getMyLeaveRequests(Long employeeId) {
        return leaveRequestRepository.findByEmployeeIdOrderByAppliedAtDesc(employeeId).stream()
                .map(leaveRequestMapper::toResponseDto)
                .toList();
    }

    // Requests from this manager's direct reports — the RBAC boundary here
    // is the data itself (the query only returns your own reports), not a
    // role check, since "manager" isn't a Role — anyone can manage people.
    public List<LeaveRequestResponseDTO> getTeamLeaveRequests(Long managerId) {
        return leaveRequestRepository.findByEmployee_Manager_IdOrderByAppliedAtDesc(managerId).stream()
                .map(leaveRequestMapper::toResponseDto)
                .toList();
    }

    public List<LeaveRequestResponseDTO> getAllLeaveRequests(LeaveStatus statusFilter) {
        List<LeaveRequest> results = statusFilter != null
                ? leaveRequestRepository.findByStatusOrderByAppliedAtDesc(statusFilter)
                : leaveRequestRepository.findAllByOrderByAppliedAtDesc();
        return results.stream().map(leaveRequestMapper::toResponseDto).toList();
    }

    @Transactional
    public LeaveRequestResponseDTO decideOnLeaveRequest(Long leaveRequestId, Long deciderEmployeeId,
                                                          boolean deciderIsAdminOrHr, LeaveDecisionDTO decision) {
        LeaveRequest leaveRequest = leaveRequestRepository.findById(leaveRequestId)
                .orElseThrow(() -> new ResourceNotFoundException("Leave request " + leaveRequestId + " not found"));

        if (leaveRequest.getStatus() != LeaveStatus.PENDING) {
            throw new IllegalArgumentException("Only pending requests can be approved or rejected");
        }
        if (decision.getDecision() != LeaveStatus.APPROVED && decision.getDecision() != LeaveStatus.REJECTED) {
            throw new IllegalArgumentException("Decision must be APPROVED or REJECTED");
        }

        // Authorization rule that isn't a static role check: HR/Admin can decide
        // on anyone's request; anyone else can only decide if they are the
        // requester's direct manager. This intentionally throws Spring
        // Security's own AccessDeniedException so it flows through the same
        // ExceptionTranslationFilter → RestAccessDeniedHandler path as every
        // other authorization failure in the app, keeping the error shape consistent.
        boolean isRequesterManager = leaveRequest.getEmployee().getManager() != null
                && leaveRequest.getEmployee().getManager().getId().equals(deciderEmployeeId);
        if (!deciderIsAdminOrHr && !isRequesterManager) {
            throw new AccessDeniedException("You are not authorized to decide on this leave request");
        }

        Employee decider = getEmployeeOrThrow(deciderEmployeeId);
        leaveRequest.setStatus(decision.getDecision());
        leaveRequest.setDecisionNote(decision.getDecisionNote());
        leaveRequest.setDecidedBy(decider);
        leaveRequest.setDecidedAt(LocalDateTime.now());

        LeaveRequest savedRequest = leaveRequestRepository.save(leaveRequest);
        String decisionLabel = decision.getDecision() == LeaveStatus.APPROVED ? "approved" : "rejected";
        String leaveTypeLabel = savedRequest.getLeaveType() == null ? "leave" : savedRequest.getLeaveType().name().toLowerCase() + " leave";
        notificationService.notifyEmployee(savedRequest.getEmployee().getId(), "Leave request " + decisionLabel,
                "Your " + leaveTypeLabel + " request has been " + decisionLabel + ".",
                decisionLabel.equals("approved") ? NotificationType.SUCCESS : NotificationType.WARNING);
        return leaveRequestMapper.toResponseDto(savedRequest);
    }

    @Transactional
    public void cancelLeaveRequest(Long leaveRequestId, Long employeeId, boolean isAdmin) {
        LeaveRequest leaveRequest = leaveRequestRepository.findById(leaveRequestId)
                .orElseThrow(() -> new ResourceNotFoundException("Leave request " + leaveRequestId + " not found"));

        boolean isOwnRequest = leaveRequest.getEmployee().getId().equals(employeeId);
        if (!isOwnRequest && !isAdmin) {
            throw new AccessDeniedException("You can only cancel your own leave requests");
        }
        if (leaveRequest.getStatus() != LeaveStatus.PENDING) {
            throw new IllegalArgumentException("Only pending requests can be cancelled");
        }

        leaveRequest.setStatus(LeaveStatus.CANCELLED);
        leaveRequestRepository.save(leaveRequest);
    }

    private Employee getEmployeeOrThrow(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee with ID " + id + " not found"));
    }
}
