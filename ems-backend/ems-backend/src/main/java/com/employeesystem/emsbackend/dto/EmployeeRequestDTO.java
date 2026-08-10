package com.employeesystem.emsbackend.dto;

import com.employeesystem.emsbackend.entity.EmploymentType;
import com.employeesystem.emsbackend.entity.EmployeeStatus;
import com.employeesystem.emsbackend.entity.Gender;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Payload accepted from the client on create/update.
 * Kept separate from the JPA entity so the API contract doesn't leak
 * persistence details (id, table mapping, etc.) and so validation lives
 * at the boundary, not scattered across the entity.
 *
 * No-args constructor + setters are kept for Jackson's JSON
 * deserialization (that's how @RequestBody actually gets built). @Builder
 * is a separate, additional way to construct one programmatically (tests,
 * anywhere else in code) — with 15 mostly-optional fields, a positional
 * all-args constructor became too easy to get wrong silently.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeRequestDTO {

    @NotBlank(message = "First name is required")
    @Size(max = 50, message = "First name must be at most 50 characters")
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(max = 50, message = "Last name must be at most 50 characters")
    private String lastName;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be a valid email address")
    private String email;

    // Optional — an employee can exist without being assigned to a
    // department or manager yet.
    private Long departmentId;
    private Long managerId;

    // --- Extended profile fields — all optional ---

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

    @Size(max = 100, message = "Designation must be at most 100 characters")
    private String designation;

    private EmploymentType employmentType;

    private EmployeeStatus status;

    @DecimalMin(value = "0.0", inclusive = true, message = "Salary cannot be negative")
    private BigDecimal salary;

    private LocalDate joiningDate;
}
