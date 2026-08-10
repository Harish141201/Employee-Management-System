package com.employeesystem.emsbackend.service;

import com.employeesystem.emsbackend.dto.LeaveDecisionDTO;
import com.employeesystem.emsbackend.dto.LeaveRequestCreateDTO;
import com.employeesystem.emsbackend.entity.*;
import com.employeesystem.emsbackend.mapper.LeaveRequestMapper;
import com.employeesystem.emsbackend.repository.EmployeeRepository;
import com.employeesystem.emsbackend.repository.LeaveRequestRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LeaveRequestServiceTest {

    @Mock private LeaveRequestRepository leaveRequestRepository;
    @Mock private EmployeeRepository employeeRepository;

    private LeaveRequestService leaveRequestService;

    @BeforeEach
    void setUp() {
        leaveRequestService = new LeaveRequestService(leaveRequestRepository, employeeRepository, new LeaveRequestMapper());
    }

    private Employee employee(long id) {
        Employee e = new Employee();
        e.setId(id);
        e.setFirstName("Test");
        e.setLastName("Employee");
        return e;
    }

    @Test
    void applyForLeave_rejectsEndDateBeforeStartDate() {
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee(1L)));

        LeaveRequestCreateDTO request = new LeaveRequestCreateDTO();
        request.setLeaveType(LeaveType.CASUAL);
        request.setStartDate(LocalDate.now().plusDays(5));
        request.setEndDate(LocalDate.now().plusDays(2));

        assertThatThrownBy(() -> leaveRequestService.applyForLeave(1L, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("End date");

        verify(leaveRequestRepository, never()).save(any());
    }

    @Test
    void applyForLeave_rejectsOverlappingDates() {
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee(1L)));
        when(leaveRequestRepository.findOverlapping(eq(1L), anyList(), any(), any()))
                .thenReturn(List.of(new LeaveRequest())); // non-empty = an overlap exists

        LeaveRequestCreateDTO request = new LeaveRequestCreateDTO();
        request.setLeaveType(LeaveType.SICK);
        request.setStartDate(LocalDate.now().plusDays(1));
        request.setEndDate(LocalDate.now().plusDays(3));

        assertThatThrownBy(() -> leaveRequestService.applyForLeave(1L, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("overlap");

        verify(leaveRequestRepository, never()).save(any());
    }

    @Test
    void decideOnLeaveRequest_deniesSomeoneWhoIsNotTheManagerOrHrAdmin() {
        Employee requester = employee(1L);
        Employee actualManager = employee(2L);
        requester.setManager(actualManager);

        LeaveRequest leaveRequest = new LeaveRequest();
        leaveRequest.setId(10L);
        leaveRequest.setEmployee(requester);
        leaveRequest.setStatus(LeaveStatus.PENDING);

        when(leaveRequestRepository.findById(10L)).thenReturn(Optional.of(leaveRequest));

        LeaveDecisionDTO decision = new LeaveDecisionDTO();
        decision.setDecision(LeaveStatus.APPROVED);

        long randomCoworkerId = 99L; // not the manager, not HR/Admin
        assertThatThrownBy(() -> leaveRequestService.decideOnLeaveRequest(10L, randomCoworkerId, false, decision))
                .isInstanceOf(AccessDeniedException.class);

        verify(leaveRequestRepository, never()).save(any());
    }

    @Test
    void decideOnLeaveRequest_allowsTheActualManagerAndUpdatesStatus() {
        Employee requester = employee(1L);
        Employee actualManager = employee(2L);
        requester.setManager(actualManager);

        LeaveRequest leaveRequest = new LeaveRequest();
        leaveRequest.setId(10L);
        leaveRequest.setEmployee(requester);
        leaveRequest.setStatus(LeaveStatus.PENDING);
        leaveRequest.setStartDate(LocalDate.now());
        leaveRequest.setEndDate(LocalDate.now().plusDays(1));

        when(leaveRequestRepository.findById(10L)).thenReturn(Optional.of(leaveRequest));
        when(employeeRepository.findById(2L)).thenReturn(Optional.of(actualManager));
        when(leaveRequestRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        LeaveDecisionDTO decision = new LeaveDecisionDTO();
        decision.setDecision(LeaveStatus.APPROVED);
        decision.setDecisionNote("Approved, enjoy the break");

        var result = leaveRequestService.decideOnLeaveRequest(10L, 2L, false, decision);

        assertThat(result.getStatus()).isEqualTo(LeaveStatus.APPROVED);
        assertThat(result.getDecidedByName()).isEqualTo("Test Employee");
        assertThat(result.getDecisionNote()).isEqualTo("Approved, enjoy the break");
    }

    @Test
    void decideOnLeaveRequest_rejectsDecidingTwice() {
        Employee requester = employee(1L);
        LeaveRequest leaveRequest = new LeaveRequest();
        leaveRequest.setId(10L);
        leaveRequest.setEmployee(requester);
        leaveRequest.setStatus(LeaveStatus.APPROVED); // already decided

        when(leaveRequestRepository.findById(10L)).thenReturn(Optional.of(leaveRequest));

        LeaveDecisionDTO decision = new LeaveDecisionDTO();
        decision.setDecision(LeaveStatus.REJECTED);

        assertThatThrownBy(() -> leaveRequestService.decideOnLeaveRequest(10L, 99L, true, decision))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("pending");
    }

    @Test
    void cancelLeaveRequest_deniesCancellingSomeoneElsesRequest() {
        Employee requester = employee(1L);
        LeaveRequest leaveRequest = new LeaveRequest();
        leaveRequest.setId(10L);
        leaveRequest.setEmployee(requester);
        leaveRequest.setStatus(LeaveStatus.PENDING);

        when(leaveRequestRepository.findById(10L)).thenReturn(Optional.of(leaveRequest));

        assertThatThrownBy(() -> leaveRequestService.cancelLeaveRequest(10L, 2L, false))
                .isInstanceOf(AccessDeniedException.class);
    }
}
