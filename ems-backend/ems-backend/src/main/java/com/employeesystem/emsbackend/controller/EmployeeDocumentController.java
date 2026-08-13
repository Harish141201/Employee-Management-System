package com.employeesystem.emsbackend.controller;

import com.employeesystem.emsbackend.dto.DocumentResponseDTO;
import com.employeesystem.emsbackend.entity.DocumentType;
import com.employeesystem.emsbackend.entity.User;
import com.employeesystem.emsbackend.service.EmployeeDocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class EmployeeDocumentController {
    private final EmployeeDocumentService documentService;

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<DocumentResponseDTO>> list(@PathVariable Long employeeId, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(documentService.list(employeeId, user));
    }

    @PostMapping(value = "/employee/{employeeId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DocumentResponseDTO> upload(@PathVariable Long employeeId, @RequestParam DocumentType documentType,
                                                       @RequestParam MultipartFile file, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(documentService.upload(employeeId, documentType, file, user));
    }

    @GetMapping("/{documentId}/download")
    public ResponseEntity<org.springframework.core.io.Resource> download(@PathVariable Long documentId, @AuthenticationPrincipal User user) {
        var document = documentService.download(documentId, user);
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(document.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(document.fileName(), StandardCharsets.UTF_8).build().toString())
                .body(document.resource());
    }

    @DeleteMapping("/{documentId}")
    public ResponseEntity<Void> delete(@PathVariable Long documentId, @AuthenticationPrincipal User user) {
        documentService.delete(documentId, user);
        return ResponseEntity.noContent().build();
    }
}
