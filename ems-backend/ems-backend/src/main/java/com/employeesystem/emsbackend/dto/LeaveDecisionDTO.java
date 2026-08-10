package com.employeesystem.emsbackend.dto;

import com.employeesystem.emsbackend.entity.LeaveStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LeaveDecisionDTO {

    @NotNull(message = "Decision is required")
    private LeaveStatus decision; // must be APPROVED or REJECTED — validated in the service

    @Size(max = 500, message = "Note must be at most 500 characters")
    private String decisionNote;
}
