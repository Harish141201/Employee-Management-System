package com.employeesystem.emsbackend.specification;

import com.employeesystem.emsbackend.entity.Employee;
import org.springframework.data.jpa.domain.Specification;

/**
 * Builds the WHERE clause dynamically based on which filters were actually
 * supplied, instead of writing a repository method for every combination
 * of (search) x (department) x (has-manager) etc.
 */
public class EmployeeSpecification {

    private EmployeeSpecification() {
    }

    public static Specification<Employee> withFilters(String search, Long departmentId) {
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

            return predicates;
        };
    }
}
