package com.employeesystem.emsbackend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "employees")
public class Employee {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "first_name")
    private String firstName;

    @Column(name = "last_name")
    private String lastName;

    @Column(name = "email_id", nullable = false, unique = true)
    private String email;

    // Nullable: an employee may not yet be assigned to a department.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    // Self-referential: every employee has at most one direct manager,
    // who is themself an Employee. Nullable so top-level staff (e.g. the
    // CEO/an unassigned new hire) don't need a manager.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private Employee manager;

    // --- Extended profile fields. All nullable — a quick "add employee"
    // shouldn't force filling in fifteen fields; HR/the employee can fill
    // these in over time via the Profile page. ---

    private String phone;

    @Column(length = 500)
    private String address;

    private LocalDate dateOfBirth;

    @Enumerated(EnumType.STRING)
    private Gender gender;

    private String bloodGroup;

    private String emergencyContactName;

    private String emergencyContactPhone;

    private String designation;

    @Enumerated(EnumType.STRING)
    private EmploymentType employmentType;

    @Enumerated(EnumType.STRING)
    private EmployeeStatus status = EmployeeStatus.ACTIVE;

    // BigDecimal, not double — money should never use floating point.
    // Nullable and deliberately never exposed to anyone but the employee
    // themself, HR, and Admin — see EmployeeResponseDTO/service layer.
    private BigDecimal salary;

    private LocalDate joiningDate;
}
