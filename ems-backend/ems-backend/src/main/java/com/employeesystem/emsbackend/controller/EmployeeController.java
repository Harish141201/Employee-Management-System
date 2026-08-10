package com.employeesystem.emsbackend.controller;

import com.employeesystem.emsbackend.dto.EmployeeRequestDTO;
import com.employeesystem.emsbackend.dto.EmployeeResponseDTO;
import com.employeesystem.emsbackend.dto.EmployeeSelfUpdateDTO;
import com.employeesystem.emsbackend.dto.PageResponseDTO;
import com.employeesystem.emsbackend.entity.User;
import com.employeesystem.emsbackend.exception.ResourceNotFoundException;
import com.employeesystem.emsbackend.service.EmployeeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "${app.cors.allowed-origin:http://localhost:5173}")
@RestController
@RequestMapping(path = "/api/emp")
@RequiredArgsConstructor
public class EmployeeController {

    private final EmployeeService employeeService;

    // ADMIN and HR browse the full roster, with search/filter/pagination
    // so this stays usable once headcount grows past a couple dozen rows.
    // Plain EMPLOYEE accounts use /api/emp/me instead.
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<PageResponseDTO<EmployeeResponseDTO>> getAllEmployee(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String direction) {

        Sort sort = direction.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        return ResponseEntity.ok(employeeService.searchEmployees(search, departmentId, pageable));
    }

    @GetMapping(path = "/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<EmployeeResponseDTO> findEmployeeById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(employeeService.findEmployeeById(id));
    }

    // Any authenticated user whose account is linked to an Employee record
    // can fetch their own profile — no HR/ADMIN role required.
    @GetMapping("/me")
    public ResponseEntity<EmployeeResponseDTO> getMyProfile(@AuthenticationPrincipal User currentUser) {
        if (currentUser.getEmployee() == null) {
            throw new ResourceNotFoundException("This account is not linked to an employee record");
        }
        return ResponseEntity.ok(employeeService.findEmployeeById(currentUser.getEmployee().getId()));
    }

    // Deliberately uses EmployeeSelfUpdateDTO, not EmployeeRequestDTO — that
    // narrower field set (no salary/department/status/etc.) is what
    // actually prevents an employee from editing their own compensation
    // or role through this endpoint, not just a UI choice to hide fields.
    @PutMapping("/me")
    public ResponseEntity<EmployeeResponseDTO> updateMyProfile(@AuthenticationPrincipal User currentUser,
                                                                 @Valid @RequestBody EmployeeSelfUpdateDTO request) {
        if (currentUser.getEmployee() == null) {
            throw new ResourceNotFoundException("This account is not linked to an employee record");
        }
        return ResponseEntity.ok(employeeService.updateOwnProfile(currentUser.getEmployee().getId(), request));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<EmployeeResponseDTO> createEmployee(@Valid @RequestBody EmployeeRequestDTO request) {
        EmployeeResponseDTO created = employeeService.addEmployee(request);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<EmployeeResponseDTO> updateEmployee(@PathVariable("id") Long id,
                                                                @Valid @RequestBody EmployeeRequestDTO request) {
        return ResponseEntity.ok(employeeService.updateEmployee(id, request));
    }

    // Deletion is ADMIN-only — HR shouldn't be able to permanently remove
    // employee records as part of routine data management.
    @DeleteMapping("{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> deleteById(@PathVariable("id") Long id) {
        employeeService.deleteEmployeeById(id);
        return ResponseEntity.ok("Employee Deleted Successfully");
    }

    @GetMapping("/email-id/{mail}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<EmployeeResponseDTO> findByEmployeeEmail(@PathVariable("mail") String email) {
        return ResponseEntity.ok(employeeService.findEmployeeByEmail(email));
    }
}
