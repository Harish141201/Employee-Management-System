package com.employeesystem.emsbackend.specification;

import com.employeesystem.emsbackend.entity.Employee;
import com.employeesystem.emsbackend.entity.EmployeeStatus;
import org.springframework.data.jpa.domain.Specification;
import java.time.LocalDate;

/**
 * Builds the WHERE clause dynamically based on which filters were actually
 * supplied, instead of writing a repository method for every combination
 * of (search) x (department) x (has-manager) etc.
 */
public class EmployeeSpecification {

    private EmployeeSpecification() {
    }

    public static Specification<Employee> withFilters(String search, Long departmentId, EmployeeStatus status, String designation, Long managerId, LocalDate joiningFrom, LocalDate joiningTo) {
        return (root, query, cb) -> {
            var predicates = cb.conjunction();

            if (search != null && !search.isBlank()) {
                String like = "%" + search.toLowerCase() + "%";
                predicates = cb.and(predicates, cb.or(
                        cb.like(cb.lower(root.get("firstName")), like),
                        cb.like(cb.lower(root.get("lastName")), like),
                        cb.like(cb.lower(root.get("email")), like)
                ));
            }

            if (departmentId != null) {
                predicates = cb.and(predicates, cb.equal(root.get("department").get("id"), departmentId));
            }

            if (status != null) {
                predicates = cb.and(predicates, cb.equal(root.get("status"), status));
            }

            if (designation != null && !designation.isBlank()) {
                predicates = cb.and(predicates, cb.like(cb.lower(root.get("designation")), "%" + designation.toLowerCase() + "%"));
            }

            if (managerId != null) {
                predicates = cb.and(predicates, cb.equal(root.get("manager").get("id"), managerId));
            }
            if (joiningFrom != null) predicates = cb.and(predicates, cb.greaterThanOrEqualTo(root.get("joiningDate"), joiningFrom));
            if (joiningTo != null) predicates = cb.and(predicates, cb.lessThanOrEqualTo(root.get("joiningDate"), joiningTo));

            return predicates;
        };
    }

    public static Specification<Employee> withFilters(String search, Long departmentId) {
        return withFilters(search, departmentId, null, null, null, null, null);
    }

    public static Specification<Employee> withFilters(String search, Long departmentId, EmployeeStatus status) {
        return withFilters(search, departmentId, status, null, null, null, null);
    }
}
