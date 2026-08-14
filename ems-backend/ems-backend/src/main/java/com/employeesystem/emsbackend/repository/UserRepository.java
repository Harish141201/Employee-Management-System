package com.employeesystem.emsbackend.repository;

import com.employeesystem.emsbackend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    @EntityGraph(attributePaths = "employee")
    Optional<User> findByUsername(String username);
    Optional<User> findByEmployeeId(Long employeeId);
    boolean existsByUsername(String username);
    boolean existsByEmployeeId(Long employeeId);
}
