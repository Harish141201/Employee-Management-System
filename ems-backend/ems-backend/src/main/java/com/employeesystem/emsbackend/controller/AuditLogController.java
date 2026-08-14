package com.employeesystem.emsbackend.controller;

import com.employeesystem.emsbackend.dto.AuditLogResponseDTO;
import com.employeesystem.emsbackend.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/audit-logs") @RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AuditLogController {
    private final AuditLogService auditLogService;
    @GetMapping public ResponseEntity<List<AuditLogResponseDTO>> list() { return ResponseEntity.ok(auditLogService.list()); }
}
