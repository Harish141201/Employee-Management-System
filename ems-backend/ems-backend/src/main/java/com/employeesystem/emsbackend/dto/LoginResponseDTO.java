package com.employeesystem.emsbackend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class LoginResponseDTO {
    private String token;
    private String username;
    private String role;
    private Long employeeId; // null if this account isn't linked to an Employee record
}
