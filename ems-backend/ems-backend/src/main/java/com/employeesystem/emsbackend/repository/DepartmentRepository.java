package com.employeesystem.emsbackend.repository;

import com.employeesystem.emsbackend.dto.DepartmentHeadcountDTO;
import com.employeesystem.emsbackend.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface DepartmentRepository extends JpaRepository<Department, Long> {
    boolean existsByNameIgnoreCase(String name);

    @Query("""
SELECT new com.employeesystem.emsbackend.dto.DepartmentHeadcountDTO(
    d.name,
    COUNT(e)
)
FROM Department d
LEFT JOIN Employee e ON e.department = d
GROUP BY d.name
ORDER BY d.name
""")
    List<DepartmentHeadcountDTO> findHeadcountByDepartment();
}
