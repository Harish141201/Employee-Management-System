package com.employeesystem.emsbackend.dto;

import com.employeesystem.emsbackend.entity.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterRequestDTO {
    @NotBlank(message = "Username is required")
    private String username;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    @Pattern(regexp = "(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+", message = "Password must include uppercase, lowercase, and a number")
    private String password;

    @NotNull(message = "Role is required")
    private Role role;

    // Optional: link this login account to an existing Employee record.
    private Long employeeId;
}
