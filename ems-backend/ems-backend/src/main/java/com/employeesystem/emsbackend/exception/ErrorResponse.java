package com.employeesystem.emsbackend.exception;

import java.time.Instant;
import java.util.List;

/**
 * Consistent error shape returned for every failure case, instead of
 * each endpoint returning ad-hoc bodies (or none at all).
 */
public record ErrorResponse(
        Instant timestamp,
        int status,
        String error,
        String message,
        String path,
        List<String> details
) {
    public ErrorResponse(int status, String error, String message, String path) {
        this(Instant.now(), status, error, message, path, null);
    }

    public ErrorResponse(int status, String error, String message, String path, List<String> details) {
        this(Instant.now(), status, error, message, path, details);
    }
}
