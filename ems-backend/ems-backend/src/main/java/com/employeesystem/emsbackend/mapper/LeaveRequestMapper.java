package com.employeesystem.emsbackend.mapper;

import com.employeesystem.emsbackend.dto.LeaveRequestResponseDTO;
import com.employeesystem.emsbackend.entity.Employee;
import com.employeesystem.emsbackend.entity.LeaveRequest;
import org.springframework.stereotype.Component;

import java.time.temporal.ChronoUnit;

@Component
public class LeaveRequestMapper {

    public LeaveRequestResponseDTO toResponseDto(LeaveRequest lr) {
        Employee decider = lr.getDecidedBy();
        long days = ChronoUnit.DAYS.between(lr.getStartDate(), lr.getEndDate()) + 1; // inclusive of both ends

        return new LeaveRequestResponseDTO(
                lr.getId(),
                lr.getEmployee().getId(),
                lr.getEmployee().getFirstName() + " " + lr.getEmployee().getLastName(),
                lr.getLeaveType(),
                lr.getStartDate(),
                lr.getEndDate(),
                days,
                lr.getReason(),
                lr.getStatus(),
                lr.getAppliedAt(),
                decider != null ? decider.getFirstName() + " " + decider.getLastName() : null,
                lr.getDecisionNote(),
                lr.getDecidedAt()
        );
    }
}
