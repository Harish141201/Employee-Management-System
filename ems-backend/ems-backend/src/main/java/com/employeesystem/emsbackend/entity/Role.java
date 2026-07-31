package com.employeesystem.emsbackend.entity;

/**
 * ADMIN   — full access: manage users, departments, all employees
 * HR      — manage employee records and departments, cannot manage user accounts
 * EMPLOYEE — read-only access to their own record
 */
public enum Role {
    ADMIN,
    HR,
    EMPLOYEE
}
