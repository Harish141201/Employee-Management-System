package com.employeesystem.emsbackend.dto;

import com.employeesystem.emsbackend.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class UserResponseDTO {
    private Long id;
    private String username;
    private Role role;
    private boolean enabled;
    private Long employeeId;
    private String employeeName;
}
