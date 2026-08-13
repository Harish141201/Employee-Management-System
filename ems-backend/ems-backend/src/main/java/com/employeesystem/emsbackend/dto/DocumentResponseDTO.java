package com.employeesystem.emsbackend.dto;

import com.employeesystem.emsbackend.entity.DocumentType;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class DocumentResponseDTO {
    private Long id;
    private Long employeeId;
    private String employeeName;
    private String fileName;
    private String contentType;
    private long fileSize;
    private DocumentType documentType;
    private String uploadedBy;
    private LocalDateTime uploadedAt;
}
