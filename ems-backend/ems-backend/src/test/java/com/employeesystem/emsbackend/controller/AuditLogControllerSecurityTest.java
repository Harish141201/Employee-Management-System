package com.employeesystem.emsbackend.controller;

import com.employeesystem.emsbackend.service.AuditLogService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import java.util.List;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest @AutoConfigureMockMvc
class AuditLogControllerSecurityTest {
    @Autowired private MockMvc mockMvc;
    @MockBean private AuditLogService auditLogService;
    @Test @WithMockUser(roles="HR") void hrCannotViewAuditLogs() throws Exception { mockMvc.perform(get("/api/audit-logs")).andExpect(status().isForbidden()); }
    @Test @WithMockUser(roles="ADMIN") void adminCanViewAuditLogs() throws Exception { when(auditLogService.list()).thenReturn(List.of()); mockMvc.perform(get("/api/audit-logs")).andExpect(status().isOk()); }
    @Test void anonymousUserCannotViewAuditLogs() throws Exception { mockMvc.perform(get("/api/audit-logs")).andExpect(status().isUnauthorized()); }
}
