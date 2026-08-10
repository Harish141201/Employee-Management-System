package com.employeesystem.emsbackend.dto;

import com.employeesystem.emsbackend.entity.Gender;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

/**
 * What an employee can edit on THEIR OWN record — deliberately a much
 * narrower field set than EmployeeRequestDTO. No firstName/lastName/email/
 * department/manager/designation/employmentType/status/salary here: those
 * stay HR/Admin-controlled via the existing endpoint. This DTO existing
 * separately is the actual security boundary — it's not just a smaller
 * form, it's the reason self-service editing can't be used to self-assign
 * a raise or move yourself to a different department.
 */
@Getter
@Setter
public class EmployeeSelfUpdateDTO {

    @Size(max = 20, message = "Phone must be at most 20 characters")
    private String phone;

    @Size(max = 500, message = "Address must be at most 500 characters")
    private String address;

    @Past(message = "Date of birth must be in the past")
    private LocalDate dateOfBirth;

    private Gender gender;

    @Size(max = 10, message = "Blood group must be at most 10 characters")
    private String bloodGroup;

    @Size(max = 100)
    private String emergencyContactName;

    @Size(max = 20)
    private String emergencyContactPhone;
}
