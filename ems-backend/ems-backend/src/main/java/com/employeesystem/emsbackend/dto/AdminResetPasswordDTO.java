package com.employeesystem.emsbackend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminResetPasswordDTO {
    @NotBlank(message = "New password is required")
    @Size(min = 8, message = "New password must be at least 8 characters")
    @Pattern(regexp = "(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+", message = "New password must include uppercase, lowercase, and a number")
    private String newPassword;
}
