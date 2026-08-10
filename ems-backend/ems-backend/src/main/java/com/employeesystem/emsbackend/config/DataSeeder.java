package com.employeesystem.emsbackend.config;

import com.employeesystem.emsbackend.entity.Employee;
import com.employeesystem.emsbackend.entity.Role;
import com.employeesystem.emsbackend.entity.User;
import com.employeesystem.emsbackend.repository.EmployeeRepository;
import com.employeesystem.emsbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Bootstraps a single ADMIN account on first startup if no users exist yet,
 * and separately ensures that admin account is linked to a real Employee
 * record — not gated behind "no users exist", so it also self-heals for
 * databases (like this project's) that already had an admin user seeded
 * before this linking existed. No manual SQL required on upgrade.
 */
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.admin-username:admin}")
    private String adminUsername;

    // No hardcoded default password on purpose — must be set explicitly,
    // otherwise every clone of this project would ship the same admin
    // password, defeating the point of fixing the last hardcoded secret.
    @Value("${app.seed.admin-password:}")
    private String adminPassword;

    @Value("${app.seed.admin-first-name:Harish}")
    private String adminFirstName;

    @Value("${app.seed.admin-last-name:Kattamuri}")
    private String adminLastName;

    @Value("${app.seed.admin-email:admin@peoplehub.local}")
    private String adminEmail;

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.count() == 0) {
            seedInitialAdmin();
        }
        linkAdminToEmployeeIfMissing();
    }

    private void seedInitialAdmin() {
        if (adminPassword == null || adminPassword.isBlank()) {
            log.warn("No users exist and ADMIN_SEED_PASSWORD is not set — skipping admin seed. "
                    + "Set the ADMIN_SEED_PASSWORD environment variable and restart to create the initial admin account.");
            return;
        }

        User admin = new User();
        admin.setUsername(adminUsername);
        admin.setPassword(passwordEncoder.encode(adminPassword));
        admin.setRole(Role.ADMIN);
        userRepository.save(admin);

        log.info("Seeded initial ADMIN account with username '{}'. Log in and create additional accounts via the Add Employee page.", adminUsername);
    }

    // Runs on every startup, not just the first — so an admin account
    // created before this linking existed gets fixed automatically the
    // next time the app restarts, instead of needing a manual DB edit.
    private void linkAdminToEmployeeIfMissing() {
        userRepository.findByUsername(adminUsername).ifPresent(admin -> {
            if (admin.getEmployee() != null) {
                return; // already linked, nothing to do
            }

            Employee employee = employeeRepository.findByEmail(adminEmail);
            if (employee == null) {
                employee = new Employee();
                employee.setFirstName(adminFirstName);
                employee.setLastName(adminLastName);
                employee.setEmail(adminEmail);
                employee = employeeRepository.save(employee);
            }

            admin.setEmployee(employee);
            userRepository.save(admin);

            log.info("Linked admin account '{}' to employee record '{} {}'.",
                    adminUsername, adminFirstName, adminLastName);
        });
    }
}
