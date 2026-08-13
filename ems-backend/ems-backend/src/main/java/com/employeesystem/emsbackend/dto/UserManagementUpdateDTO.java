package com.employeesystem.emsbackend.dto;

import com.employeesystem.emsbackend.entity.Role;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserManagementUpdateDTO {
    @NotNull private Role role;
    private Long employeeId;
    private boolean enabled;
}
