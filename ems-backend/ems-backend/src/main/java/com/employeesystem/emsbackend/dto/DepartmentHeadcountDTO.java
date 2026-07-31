package com.employeesystem.emsbackend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class DepartmentHeadcountDTO {
    private String departmentName;
    private long employeeCount;
}
