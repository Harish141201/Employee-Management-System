package com.employeesystem.emsbackend.config;

import com.employeesystem.emsbackend.entity.Role;
import com.employeesystem.emsbackend.entity.User;
import com.employeesystem.emsbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Bootstraps a single ADMIN account on first startup if no users exist yet.
 * Without this, there'd be no way to log in and create the first account,
 * since /api/auth/register itself requires ADMIN.
 */
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.admin-username:admin}")
    private String adminUsername;

    // No hardcoded default password on purpose — must be set explicitly,
    // otherwise every clone of this project would ship the same admin
    // password, defeating the point of fixing the last hardcoded secret.
    @Value("${app.seed.admin-password:}")
    private String adminPassword;

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            return; // already seeded / users exist
        }

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

        log.info("Seeded initial ADMIN account with username '{}'. Log in and create additional accounts via POST /api/auth/register.", adminUsername);
    }
}
