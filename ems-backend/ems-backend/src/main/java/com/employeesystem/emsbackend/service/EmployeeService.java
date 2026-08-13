package com.employeesystem.emsbackend.service;

import com.employeesystem.emsbackend.dto.EmployeeRequestDTO;
import com.employeesystem.emsbackend.dto.EmployeeResponseDTO;
import com.employeesystem.emsbackend.dto.EmployeeSelfUpdateDTO;
import com.employeesystem.emsbackend.dto.PageResponseDTO;
import com.employeesystem.emsbackend.entity.Department;
import com.employeesystem.emsbackend.entity.Employee;
import com.employeesystem.emsbackend.entity.EmployeeStatus;
import com.employeesystem.emsbackend.exception.DuplicateResourceException;
import com.employeesystem.emsbackend.exception.ResourceInUseException;
import com.employeesystem.emsbackend.exception.ResourceNotFoundException;
import com.employeesystem.emsbackend.mapper.EmployeeMapper;
import com.employeesystem.emsbackend.repository.DepartmentRepository;
import com.employeesystem.emsbackend.repository.EmployeeRepository;
import com.employeesystem.emsbackend.repository.LeaveRequestRepository;
import com.employeesystem.emsbackend.repository.UserRepository;
import com.employeesystem.emsbackend.specification.EmployeeSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final EmployeeMapper employeeMapper;

    @Transactional
    public EmployeeResponseDTO addEmployee(EmployeeRequestDTO request) {
        if (employeeRepository.findByEmail(request.getEmail()) != null) {
            throw new DuplicateResourceException(
                    "An employee with email " + request.getEmail() + " already exists");
        }
        Employee employee = employeeMapper.toEntity(request);
        applyDepartmentAndManager(employee, request, null);
        Employee saved = employeeRepository.save(employee);
        return employeeMapper.toResponseDto(saved);
    }

    public EmployeeResponseDTO findEmployeeById(Long employeeId) {
        Employee employee = getEmployeeOrThrow(employeeId);
        return employeeMapper.toResponseDto(employee);
    }

    public List<EmployeeResponseDTO> getAllEmployee() {
        return employeeRepository.findAll().stream()
                .map(employeeMapper::toResponseDto)
                .toList();
    }

    public PageResponseDTO<EmployeeResponseDTO> searchEmployees(String search, Long departmentId, EmployeeStatus status, String designation, Long managerId, LocalDate joiningFrom, LocalDate joiningTo, Pageable pageable) {
        Page<Employee> page = employeeRepository.findAll(
                EmployeeSpecification.withFilters(search, departmentId, status, designation, managerId, joiningFrom, joiningTo), pageable);
        Page<EmployeeResponseDTO> mapped = page.map(employeeMapper::toResponseDto);
        return PageResponseDTO.from(mapped);
    }

    public PageResponseDTO<EmployeeResponseDTO> searchEmployees(String search, Long departmentId, Pageable pageable) {
        return searchEmployees(search, departmentId, null, null, null, null, null, pageable);
    }

    public PageResponseDTO<EmployeeResponseDTO> searchEmployees(String search, Long departmentId, EmployeeStatus status, Pageable pageable) {
        return searchEmployees(search, departmentId, status, null, null, null, null, pageable);
    }

    @Transactional
    public EmployeeResponseDTO updateEmployee(Long id, EmployeeRequestDTO request) {
        Employee existingEmployee = getEmployeeOrThrow(id);

        Employee employeeWithSameEmail = employeeRepository.findByEmail(request.getEmail());
        if (employeeWithSameEmail != null && !employeeWithSameEmail.getId().equals(id)) {
            throw new DuplicateResourceException(
                    "An employee with email " + request.getEmail() + " already exists");
        }

        employeeMapper.updateEntityFromDto(request, existingEmployee);
        applyDepartmentAndManager(existingEmployee, request, id);
        Employee saved = employeeRepository.save(existingEmployee);
        return employeeMapper.toResponseDto(saved);
    }

    @Transactional
    public EmployeeResponseDTO updateOwnProfile(Long employeeId, EmployeeSelfUpdateDTO request) {
        Employee employee = getEmployeeOrThrow(employeeId);

        employee.setPhone(request.getPhone());
        employee.setAddress(request.getAddress());
        employee.setDateOfBirth(request.getDateOfBirth());
        employee.setGender(request.getGender());
        employee.setBloodGroup(request.getBloodGroup());
        employee.setEmergencyContactName(request.getEmergencyContactName());
        employee.setEmergencyContactPhone(request.getEmergencyContactPhone());

        Employee saved = employeeRepository.save(employee);
        return employeeMapper.toResponseDto(saved);
    }

    @Transactional
    public void deleteEmployeeById(Long id) {
        if (!employeeRepository.existsById(id)) {
            throw new ResourceNotFoundException("Employee with ID " + id + " not found");
        }

        List<String> reasons = new ArrayList<>();

        long directReports = employeeRepository.countByManagerId(id);
        if (directReports > 0) {
            reasons.add(directReports + " direct report" + (directReports == 1 ? "" : "s"));
        }

        long leaveRecords = leaveRequestRepository.countByEmployeeId(id);
        if (leaveRecords > 0) {
            reasons.add(leaveRecords + " leave request" + (leaveRecords == 1 ? "" : "s"));
        }

        if (userRepository.existsByEmployeeId(id)) {
            reasons.add("a linked login account");
        }

        if (!reasons.isEmpty()) {
            throw new ResourceInUseException(
                    "Cannot delete this employee: they have " + String.join(", ", reasons)
                            + ". Reassign or remove those first, or set their status to Terminated instead of deleting."
            );
        }

        employeeRepository.deleteById(id);
    }

    public EmployeeResponseDTO findEmployeeByEmail(String email) {
        Employee employee = employeeRepository.findByEmail(email);
        if (employee == null) {
            throw new ResourceNotFoundException("Employee with email " + email + " not found");
        }
        return employeeMapper.toResponseDto(employee);
    }

    private Employee getEmployeeOrThrow(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee with ID " + id + " not found"));
    }

    private void applyDepartmentAndManager(Employee employee, EmployeeRequestDTO request, Long currentEmployeeId) {
        if (request.getDepartmentId() != null) {
            Department department = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Department with ID " + request.getDepartmentId() + " not found"));
            employee.setDepartment(department);
        } else {
            employee.setDepartment(null);
        }

        if (request.getManagerId() != null) {
            if (currentEmployeeId != null && request.getManagerId().equals(currentEmployeeId)) {
                throw new IllegalArgumentException("An employee cannot be their own manager");
            }
            Employee manager = getEmployeeOrThrow(request.getManagerId());
            employee.setManager(manager);
        } else {
            employee.setManager(null);
        }
    }
}
