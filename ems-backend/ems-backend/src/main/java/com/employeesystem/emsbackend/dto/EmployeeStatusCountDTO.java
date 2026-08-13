package com.employeesystem.emsbackend.dto;

import com.employeesystem.emsbackend.entity.EmployeeStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class EmployeeStatusCountDTO {
    private EmployeeStatus status;
    private long employeeCount;
}
