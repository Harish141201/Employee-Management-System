package com.employeesystem.emsbackend.repository;


import com.employeesystem.emsbackend.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface EmployeeRepository extends JpaRepository<Employee, Long>, JpaSpecificationExecutor<Employee> {
    Employee findByEmail(String email);

    long countByManagerId(Long managerId);
}
