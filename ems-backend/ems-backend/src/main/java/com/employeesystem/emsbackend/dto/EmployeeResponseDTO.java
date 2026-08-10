package com.employeesystem.emsbackend.dto;

import com.employeesystem.emsbackend.entity.EmploymentType;
import com.employeesystem.emsbackend.entity.EmployeeStatus;
import com.employeesystem.emsbackend.entity.Gender;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Shape returned to the client. Includes flattened department/manager
 * info (id + display name) rather than nested objects, since the
 * frontend list/detail views only ever need the name to display.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeResponseDTO {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;

    private Long departmentId;
    private String departmentName;

    private Long managerId;
    private String managerName;

    private String phone;
    private String address;
    private LocalDate dateOfBirth;
    private Gender gender;
    private String bloodGroup;
    private String emergencyContactName;
    private String emergencyContactPhone;
    private String designation;
    private EmploymentType employmentType;
    private EmployeeStatus status;
    private BigDecimal salary;
    private LocalDate joiningDate;
}
