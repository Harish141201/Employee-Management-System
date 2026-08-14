package com.employeesystem.emsbackend.controller;

import com.employeesystem.emsbackend.service.CalendarEventService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest @AutoConfigureMockMvc
class CalendarEventControllerSecurityTest {
    @Autowired private MockMvc mockMvc;
    @MockBean private CalendarEventService calendarEventService;
    @Test @WithMockUser(roles="EMPLOYEE") void employeeCanViewCalendarEvents() throws Exception { mockMvc.perform(get("/api/calendar-events")).andExpect(status().isOk()); }
    @Test void anonymousUserCannotViewCalendarEvents() throws Exception { mockMvc.perform(get("/api/calendar-events")).andExpect(status().isUnauthorized()); }
    @Test @WithMockUser(roles="EMPLOYEE") void employeeCannotCreateCalendarEvents() throws Exception { mockMvc.perform(post("/api/calendar-events").contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"Holiday\",\"eventDate\":\"2026-12-25\",\"type\":\"HOLIDAY\"}")).andExpect(status().isForbidden()); }
    @Test @WithMockUser(roles="HR") void hrCanCreateCalendarEvents() throws Exception { mockMvc.perform(post("/api/calendar-events").contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"Holiday\",\"eventDate\":\"2026-12-25\",\"type\":\"HOLIDAY\"}")).andExpect(status().isCreated()); }
    @Test @WithMockUser(roles="ADMIN") void adminCanDeleteCalendarEvents() throws Exception { mockMvc.perform(delete("/api/calendar-events/1")).andExpect(status().isNoContent()); }
}
