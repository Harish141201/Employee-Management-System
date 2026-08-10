package com.employeesystem.emsbackend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class LoginResponseDTO {
    private String token;
    private String refreshToken;
    private String username;
    private String role;
    private Long employeeId; // null if this account isn't linked to an Employee record
    private String employeeName; // null under the same condition — display name for the UI
}
