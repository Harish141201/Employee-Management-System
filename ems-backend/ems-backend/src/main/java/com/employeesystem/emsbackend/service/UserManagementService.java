package com.employeesystem.emsbackend.service;

import com.employeesystem.emsbackend.dto.UserManagementUpdateDTO;
import com.employeesystem.emsbackend.dto.UserResponseDTO;
import com.employeesystem.emsbackend.entity.Employee;
import com.employeesystem.emsbackend.entity.User;
import com.employeesystem.emsbackend.exception.DuplicateResourceException;
import com.employeesystem.emsbackend.exception.ResourceNotFoundException;
import com.employeesystem.emsbackend.repository.EmployeeRepository;
import com.employeesystem.emsbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserManagementService {
    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;

    @Transactional(readOnly = true)
    public List<UserResponseDTO> list() {
        return userRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional
    public UserResponseDTO update(Long userId, UserManagementUpdateDTO request, Long actingUserId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User with ID " + userId + " not found"));
        if (userId.equals(actingUserId) && !request.isEnabled()) throw new IllegalArgumentException("You cannot disable your own account");
        user.setRole(request.getRole());
        if (request.getEmployeeId() == null) {
            user.setEmployee(null);
        } else if (user.getEmployee() == null || !request.getEmployeeId().equals(user.getEmployee().getId())) {
            if (userRepository.existsByEmployeeId(request.getEmployeeId())) throw new DuplicateResourceException("This employee is already linked to another user");
            Employee employee = employeeRepository.findById(request.getEmployeeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Employee with ID " + request.getEmployeeId() + " not found"));
            user.setEmployee(employee);
        }
        user.setEnabled(request.isEnabled());
        return toResponse(userRepository.save(user));
    }

    private UserResponseDTO toResponse(User user) {
        Employee employee = user.getEmployee();
        return new UserResponseDTO(user.getId(), user.getUsername(), user.getRole(), user.isEnabled(),
                employee == null ? null : employee.getId(), employee == null ? null : employee.getFirstName() + " " + employee.getLastName());
    }
}
