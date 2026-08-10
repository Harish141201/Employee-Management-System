package com.employeesystem.emsbackend.repository;

import com.employeesystem.emsbackend.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByToken(String token);

    // One active refresh token per user, kept simple deliberately — logging
    // in again invalidates any previous session's refresh capability
    // rather than supporting concurrent multi-device sessions, which would
    // need a real "list of active sessions" model to do properly.
    void deleteByUserId(Long userId);
}
