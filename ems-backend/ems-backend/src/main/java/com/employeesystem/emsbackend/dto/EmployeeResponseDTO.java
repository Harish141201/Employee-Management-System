package com.employeesystem.emsbackend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Shape returned to the client. Includes flattened department/manager
 * info (id + display name) rather than nested objects, since the
 * frontend list/detail views only ever need the name to display.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeResponseDTO {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;

    private Long departmentId;
    private String departmentName;

    private Long managerId;
    private String managerName;
}
