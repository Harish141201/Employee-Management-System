package com.employeesystem.emsbackend.repository;


import com.employeesystem.emsbackend.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import com.employeesystem.emsbackend.entity.EmployeeStatus;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.Query;

public interface EmployeeRepository extends JpaRepository<Employee, Long>, JpaSpecificationExecutor<Employee> {
    Employee findByEmail(String email);

    long countByManagerId(Long managerId);

    long countByStatus(EmployeeStatus status);

    long countByJoiningDateGreaterThanEqual(LocalDate joiningDate);

    long countByDepartmentId(Long departmentId);

    long countByDepartmentIdAndStatus(Long departmentId, EmployeeStatus status);

    List<Employee> findTop5ByJoiningDateIsNotNullOrderByJoiningDateDesc();

    @Query("SELECT e.status, COUNT(e) FROM Employee e GROUP BY e.status")
    List<Object[]> countByStatusGroup();
}
