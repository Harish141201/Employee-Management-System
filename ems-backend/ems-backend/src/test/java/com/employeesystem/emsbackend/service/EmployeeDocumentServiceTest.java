package com.employeesystem.emsbackend.service;

import com.employeesystem.emsbackend.entity.*;
import com.employeesystem.emsbackend.exception.ResourceNotFoundException;
import com.employeesystem.emsbackend.repository.EmployeeDocumentRepository;
import com.employeesystem.emsbackend.repository.EmployeeRepository;
import com.employeesystem.emsbackend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmployeeDocumentServiceTest {

    private static final byte[] PDF_BYTES = "%PDF-1.4 fake pdf body".getBytes();
    private static final byte[] PNG_BYTES = new byte[]{
            (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x01, 0x02};
    private static final byte[] EXE_BYTES = new byte[]{0x4D, 0x5A, 0x00, 0x01}; // "MZ" Windows executable header

    @Mock private EmployeeDocumentRepository documentRepository;
    @Mock private EmployeeRepository employeeRepository;
    @Mock private UserRepository userRepository;

    private EmployeeDocumentService documentService;

    @BeforeEach
    void setUp(@org.junit.jupiter.api.io.TempDir java.nio.file.Path tempDir) {
        documentService = new EmployeeDocumentService(documentRepository, employeeRepository, userRepository);
        ReflectionTestUtils.setField(documentService, "storagePath", tempDir.toString());
    }

    private Employee employee(long id) {
        Employee employee = new Employee();
        employee.setId(id);
        employee.setFirstName("Ava");
        employee.setLastName("Stone");
        return employee;
    }

    private User userFor(Role role, Employee employee) {
        User user = new User();
        user.setId(99L);
        user.setUsername("tester");
        user.setRole(role);
        user.setEmployee(employee);
        return user;
    }

    // --- Authorization (the highest-risk logic in this module: an Employee
    // must only ever reach their own documents) ---

    @Test
    void list_rejectsAnEmployeeReadingSomeoneElsesDocuments() {
        Employee self = employee(7L);
        User employeeUser = userFor(Role.EMPLOYEE, self);

        assertThatThrownBy(() -> documentService.list(42L, employeeUser))
                .isInstanceOf(AccessDeniedException.class);
        verifyNoInteractions(documentRepository);
    }

    @Test
    void list_allowsAnEmployeeReadingTheirOwnDocuments() {
        Employee self = employee(7L);
        User employeeUser = userFor(Role.EMPLOYEE, self);
        when(documentRepository.findByEmployeeIdOrderByUploadedAtDesc(7L)).thenReturn(List.of());

        List<?> result = documentService.list(7L, employeeUser);

        assertThat(result).isEmpty();
        verify(documentRepository).findByEmployeeIdOrderByUploadedAtDesc(7L);
    }

    @Test
    void list_allowsHrToReadAnyEmployeesDocuments() {
        User hrUser = userFor(Role.HR, null);
        when(documentRepository.findByEmployeeIdOrderByUploadedAtDesc(42L)).thenReturn(List.of());

        documentService.list(42L, hrUser);

        verify(documentRepository).findByEmployeeIdOrderByUploadedAtDesc(42L);
    }

    @Test
    void requireEmployeeAccess_rejectsAnEmployeeWithNoLinkedEmployeeRecord() {
        User employeeUser = userFor(Role.EMPLOYEE, null);

        assertThatThrownBy(() -> documentService.list(7L, employeeUser))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void download_rejectsAnEmployeeDownloadingAnotherEmployeesDocument() {
        Employee owner = employee(42L);
        EmployeeDocument document = new EmployeeDocument();
        document.setId(1L);
        document.setEmployee(owner);
        when(documentRepository.findById(1L)).thenReturn(Optional.of(document));

        User otherEmployeeUser = userFor(Role.EMPLOYEE, employee(7L));

        assertThatThrownBy(() -> documentService.download(1L, otherEmployeeUser))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void download_throwsNotFoundForAnUnknownDocumentId() {
        when(documentRepository.findById(1L)).thenReturn(Optional.empty());
        User adminUser = userFor(Role.ADMIN, null);

        assertThatThrownBy(() -> documentService.download(1L, adminUser))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // --- Upload validation: real content-type sniffing, not the
    // client-supplied header or file extension ---

    @Test
    void upload_rejectsAFileWhoseBytesDontMatchAnyAllowedType() {
        User adminUser = userFor(Role.ADMIN, null);
        MockMultipartFile spoofedFile = new MockMultipartFile(
                "file", "totally-a-resume.pdf", "application/pdf", EXE_BYTES);

        assertThatThrownBy(() -> documentService.upload(1L, DocumentType.RESUME, spoofedFile, adminUser))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Only PDF, PNG, and JPEG");
        verifyNoInteractions(documentRepository);
    }

    @Test
    void upload_rejectsAFileWhoseExtensionDoesNotMatchItsRealContent() {
        // Real PNG bytes, but named and declared as a PDF — the header lies,
        // the extension lies, only the bytes tell the truth.
        User adminUser = userFor(Role.ADMIN, null);
        MockMultipartFile mismatchedFile = new MockMultipartFile(
                "file", "resume.pdf", "application/pdf", PNG_BYTES);

        assertThatThrownBy(() -> documentService.upload(1L, DocumentType.RESUME, mismatchedFile, adminUser))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("do not match");
        verifyNoInteractions(documentRepository);
    }

    @Test
    void upload_ignoresASpoofedContentTypeHeaderAndTrustsTheRealBytes() {
        // Client declares image/png, but the bytes are a genuine PDF — the
        // service should sniff the true type and accept it as a PDF.
        User adminUser = userFor(Role.ADMIN, null);
        Employee target = employee(1L);
        MockMultipartFile file = new MockMultipartFile(
                "file", "resume.pdf", "image/png", PDF_BYTES);

        when(employeeRepository.findById(1L)).thenReturn(Optional.of(target));
        when(userRepository.findById(99L)).thenReturn(Optional.of(adminUser));
        when(documentRepository.save(any(EmployeeDocument.class))).thenAnswer(invocation -> {
            EmployeeDocument doc = invocation.getArgument(0);
            doc.setId(5L);
            return doc;
        });

        var response = documentService.upload(1L, DocumentType.RESUME, file, adminUser);

        ArgumentCaptor<EmployeeDocument> captor = ArgumentCaptor.forClass(EmployeeDocument.class);
        verify(documentRepository).save(captor.capture());
        assertThat(captor.getValue().getContentType()).isEqualTo("application/pdf");
        assertThat(response.getContentType()).isEqualTo("application/pdf");
    }

    @Test
    void upload_rejectsAFileOverTheSizeLimit() {
        User adminUser = userFor(Role.ADMIN, null);
        byte[] tooLarge = new byte[11 * 1024 * 1024];
        MockMultipartFile file = new MockMultipartFile("file", "big.pdf", "application/pdf", tooLarge);

        assertThatThrownBy(() -> documentService.upload(1L, DocumentType.RESUME, file, adminUser))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("10 MB");
        verifyNoInteractions(documentRepository);
    }

    @Test
    void upload_rejectsAnEmptyFile() {
        User adminUser = userFor(Role.ADMIN, null);
        MockMultipartFile file = new MockMultipartFile("file", "empty.pdf", "application/pdf", new byte[0]);

        assertThatThrownBy(() -> documentService.upload(1L, DocumentType.RESUME, file, adminUser))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Select a document");
    }

    @Test
    void upload_rejectsAnEmployeeUploadingToAnotherEmployeesRecord() {
        User employeeUser = userFor(Role.EMPLOYEE, employee(7L));
        MockMultipartFile file = new MockMultipartFile("file", "resume.pdf", "application/pdf", PDF_BYTES);

        assertThatThrownBy(() -> documentService.upload(42L, DocumentType.RESUME, file, employeeUser))
                .isInstanceOf(AccessDeniedException.class);
        verifyNoInteractions(documentRepository);
    }

    // --- Delete: authorization + best-effort file cleanup shouldn't block
    // metadata deletion ---

    @Test
    void delete_rejectsAnEmployeeDeletingAnotherEmployeesDocument() {
        Employee owner = employee(42L);
        EmployeeDocument document = new EmployeeDocument();
        document.setId(1L);
        document.setEmployee(owner);
        document.setStoredFileName("does-not-exist.pdf");
        when(documentRepository.findById(1L)).thenReturn(Optional.of(document));

        User otherEmployeeUser = userFor(Role.EMPLOYEE, employee(7L));

        assertThatThrownBy(() -> documentService.delete(1L, otherEmployeeUser))
                .isInstanceOf(AccessDeniedException.class);
        verify(documentRepository, never()).delete(any());
    }

    @Test
    void delete_removesMetadataEvenWhenTheUnderlyingFileIsAlreadyGone() {
        Employee owner = employee(7L);
        EmployeeDocument document = new EmployeeDocument();
        document.setId(1L);
        document.setEmployee(owner);
        document.setStoredFileName("already-deleted.pdf");
        when(documentRepository.findById(1L)).thenReturn(Optional.of(document));

        User selfUser = userFor(Role.EMPLOYEE, owner);

        documentService.delete(1L, selfUser);

        verify(documentRepository).delete(document);
    }
}
