package com.employeesystem.emsbackend.service;

import com.employeesystem.emsbackend.dto.DocumentResponseDTO;
import com.employeesystem.emsbackend.entity.*;
import com.employeesystem.emsbackend.exception.ResourceNotFoundException;
import com.employeesystem.emsbackend.repository.EmployeeDocumentRepository;
import com.employeesystem.emsbackend.repository.EmployeeRepository;
import com.employeesystem.emsbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EmployeeDocumentService {
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of("application/pdf", "image/jpeg", "image/png");

    private final EmployeeDocumentRepository documentRepository;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;

    @Value("${app.documents.storage-path:./uploads/peoplehub-documents}")
    private String storagePath;

    @Transactional
    public DocumentResponseDTO upload(Long employeeId, DocumentType documentType, MultipartFile file, User currentUser) {
        requireEmployeeAccess(employeeId, currentUser);
        validateFile(file);
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee with ID " + employeeId + " not found"));
        User uploader = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        String originalName = Path.of(file.getOriginalFilename()).getFileName().toString();
        String extension = originalName.substring(originalName.lastIndexOf('.') + 1).toLowerCase();
        String storedName = UUID.randomUUID() + "." + extension;
        try {
            Path directory = Path.of(storagePath).toAbsolutePath().normalize();
            Files.createDirectories(directory);
            Files.copy(file.getInputStream(), directory.resolve(storedName), StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException ex) {
            throw new IllegalStateException("The document could not be stored");
        }
        EmployeeDocument document = new EmployeeDocument();
        document.setEmployee(employee);
        document.setDocumentType(documentType);
        document.setOriginalFileName(originalName);
        document.setStoredFileName(storedName);
        document.setContentType(file.getContentType());
        document.setFileSize(file.getSize());
        document.setUploadedBy(uploader);
        document.setUploadedAt(LocalDateTime.now());
        return toResponse(documentRepository.save(document));
    }

    @Transactional(readOnly = true)
    public List<DocumentResponseDTO> list(Long employeeId, User currentUser) {
        requireEmployeeAccess(employeeId, currentUser);
        return documentRepository.findByEmployeeIdOrderByUploadedAtDesc(employeeId).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public DownloadedDocument download(Long documentId, User currentUser) {
        EmployeeDocument document = findDocument(documentId);
        requireEmployeeAccess(document.getEmployee().getId(), currentUser);
        Path file = Path.of(storagePath).toAbsolutePath().normalize().resolve(document.getStoredFileName()).normalize();
        if (!file.startsWith(Path.of(storagePath).toAbsolutePath().normalize()) || !Files.isRegularFile(file)) {
            throw new ResourceNotFoundException("Document file was not found");
        }
        return new DownloadedDocument(new FileSystemResource(file), document.getOriginalFileName(), document.getContentType());
    }

    @Transactional
    public void delete(Long documentId, User currentUser) {
        EmployeeDocument document = findDocument(documentId);
        requireEmployeeAccess(document.getEmployee().getId(), currentUser);
        documentRepository.delete(document);
        try {
            Files.deleteIfExists(Path.of(storagePath).toAbsolutePath().normalize().resolve(document.getStoredFileName()));
        } catch (IOException ignored) {
            // Metadata deletion remains authoritative; orphan-file cleanup can be handled operationally.
        }
    }

    private EmployeeDocument findDocument(Long documentId) {
        return documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document with ID " + documentId + " not found"));
    }

    private void requireEmployeeAccess(Long employeeId, User user) {
        if (user.getRole() == Role.ADMIN || user.getRole() == Role.HR) return;
        if (user.getEmployee() == null || !employeeId.equals(user.getEmployee().getId())) {
            throw new AccessDeniedException("You do not have access to this employee's documents");
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("Select a document to upload");
        if (file.getSize() > MAX_FILE_SIZE) throw new IllegalArgumentException("Document must be 10 MB or smaller");
        if (!ALLOWED_CONTENT_TYPES.contains(file.getContentType())) throw new IllegalArgumentException("Only PDF, PNG, and JPEG documents are allowed");
        String name = file.getOriginalFilename();
        if (name == null || !name.matches("(?i).+\\.(pdf|png|jpe?g)$")) throw new IllegalArgumentException("Document file name must end in .pdf, .png, .jpg, or .jpeg");
    }

    private DocumentResponseDTO toResponse(EmployeeDocument document) {
        Employee employee = document.getEmployee();
        return new DocumentResponseDTO(document.getId(), employee.getId(), employee.getFirstName() + " " + employee.getLastName(),
                document.getOriginalFileName(), document.getContentType(), document.getFileSize(), document.getDocumentType(),
                document.getUploadedBy().getUsername(), document.getUploadedAt());
    }

    public record DownloadedDocument(Resource resource, String fileName, String contentType) { }
}
