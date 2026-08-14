package com.employeesystem.emsbackend.service;

import com.employeesystem.emsbackend.dto.AuditLogResponseDTO;
import com.employeesystem.emsbackend.entity.AuditLog;
import com.employeesystem.emsbackend.entity.User;
import com.employeesystem.emsbackend.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service @RequiredArgsConstructor
public class AuditLogService {
    private final AuditLogRepository auditLogRepository;
    @Transactional public void record(User user, String action, String entityType, Long entityId, String description) {
        AuditLog entry = new AuditLog(); entry.setUser(user); entry.setAction(action); entry.setEntityType(entityType); entry.setEntityId(entityId); entry.setDescription(description); entry.setCreatedAt(LocalDateTime.now()); auditLogRepository.save(entry);
    }
    @Transactional(readOnly = true) public List<AuditLogResponseDTO> list() {
        return auditLogRepository.findTop100ByOrderByCreatedAtDesc().stream().map(entry -> new AuditLogResponseDTO(entry.getId(), entry.getUser().getUsername(), entry.getAction(), entry.getEntityType(), entry.getEntityId(), entry.getDescription(), entry.getCreatedAt())).toList();
    }
}
