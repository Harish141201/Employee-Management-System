package com.employeesystem.emsbackend.controller;

import com.employeesystem.emsbackend.dto.PageResponseDTO;
import com.employeesystem.emsbackend.service.EmployeeService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Exercises the actual @PreAuthorize rules end-to-end through the real
 * SecurityConfig filter chain (minus needing a real JWT — @WithMockUser
 * injects the SecurityContext directly), rather than unit-testing the
 * annotations in isolation. This is what actually proves the RBAC matrix
 * documented in SETUP.md is enforced, not just declared.
 */
@SpringBootTest
@AutoConfigureMockMvc
class EmployeeControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private EmployeeService employeeService;

    @Test
    @WithMockUser(roles = "EMPLOYEE")
    void employeeRole_isForbiddenFromListingAllEmployees() throws Exception {
        mockMvc.perform(get("/api/emp"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "HR")
    void hrRole_canListAllEmployees() throws Exception {
        when(employeeService.searchEmployees(any(), any(), any()))
                .thenReturn(new PageResponseDTO<>(List.of(), 0, 10, 0, 0, true));

        mockMvc.perform(get("/api/emp"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "HR")
    void hrRole_isForbiddenFromDeletingAnEmployee() throws Exception {
        mockMvc.perform(delete("/api/emp/1"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminRole_canDeleteAnEmployee() throws Exception {
        mockMvc.perform(delete("/api/emp/1"))
                .andExpect(status().isOk());
    }

    @Test
    void anonymousRequest_isRejectedAsUnauthenticated() throws Exception {
        mockMvc.perform(get("/api/emp"))
                .andExpect(status().isUnauthorized());
    }
}
