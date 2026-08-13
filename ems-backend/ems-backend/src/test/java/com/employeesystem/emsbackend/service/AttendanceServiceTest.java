package com.employeesystem.emsbackend.service;

import com.employeesystem.emsbackend.entity.Attendance;
import com.employeesystem.emsbackend.entity.Employee;
import com.employeesystem.emsbackend.exception.DuplicateResourceException;
import com.employeesystem.emsbackend.exception.ResourceNotFoundException;
import com.employeesystem.emsbackend.repository.AttendanceRepository;
import com.employeesystem.emsbackend.repository.EmployeeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AttendanceServiceTest {

    @Mock private AttendanceRepository attendanceRepository;
    @Mock private EmployeeRepository employeeRepository;

    private AttendanceService attendanceService;

    @BeforeEach
    void setUp() {
        attendanceService = new AttendanceService(attendanceRepository, employeeRepository);
    }

    private Employee employee(long id) {
        Employee employee = new Employee();
        employee.setId(id);
        employee.setFirstName("Ava");
        employee.setLastName("Stone");
        return employee;
    }

    @Test
    void checkIn_createsTodaysPresentRecord() {
        Employee employee = employee(7L);
        when(attendanceRepository.findByEmployeeIdAndAttendanceDate(7L, LocalDate.now())).thenReturn(Optional.empty());
        when(employeeRepository.findById(7L)).thenReturn(Optional.of(employee));
        when(attendanceRepository.save(any(Attendance.class))).thenAnswer(invocation -> {
            Attendance attendance = invocation.getArgument(0);
            attendance.setId(12L);
            return attendance;
        });

        var response = attendanceService.checkIn(7L);

        ArgumentCaptor<Attendance> attendanceCaptor = ArgumentCaptor.forClass(Attendance.class);
        verify(attendanceRepository).save(attendanceCaptor.capture());
        assertThat(attendanceCaptor.getValue().getEmployee()).isSameAs(employee);
        assertThat(attendanceCaptor.getValue().getAttendanceDate()).isEqualTo(LocalDate.now());
        assertThat(attendanceCaptor.getValue().getCheckInAt()).isNotNull();
        assertThat(response.getEmployeeName()).isEqualTo("Ava Stone");
        assertThat(response.getWorkedMinutes()).isZero();
    }

    @Test
    void checkIn_rejectsASecondCheckInOnTheSameDay() {
        when(attendanceRepository.findByEmployeeIdAndAttendanceDate(anyLong(), any())).thenReturn(Optional.of(new Attendance()));

        assertThatThrownBy(() -> attendanceService.checkIn(7L))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("already checked in");

        verify(employeeRepository, never()).findById(anyLong());
        verify(attendanceRepository, never()).save(any());
    }

    @Test
    void checkOut_requiresTodaysCheckIn() {
        when(attendanceRepository.findByEmployeeIdAndAttendanceDate(7L, LocalDate.now())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> attendanceService.checkOut(7L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("No check-in");
    }

    @Test
    void checkOut_setsCheckoutAndCalculatesWorkedMinutes() {
        Attendance attendance = new Attendance();
        attendance.setId(12L);
        attendance.setEmployee(employee(7L));
        attendance.setAttendanceDate(LocalDate.now());
        attendance.setCheckInAt(LocalDateTime.now().minusMinutes(125));
        when(attendanceRepository.findByEmployeeIdAndAttendanceDate(7L, LocalDate.now())).thenReturn(Optional.of(attendance));
        when(attendanceRepository.save(attendance)).thenReturn(attendance);

        var response = attendanceService.checkOut(7L);

        assertThat(attendance.getCheckOutAt()).isNotNull();
        assertThat(response.getWorkedMinutes()).isGreaterThanOrEqualTo(124);
        verify(attendanceRepository).save(attendance);
    }

    @Test
    void getMyAttendance_mapsRecordsInRepositoryOrder() {
        Attendance attendance = new Attendance();
        attendance.setId(12L);
        attendance.setEmployee(employee(7L));
        attendance.setAttendanceDate(LocalDate.now().minusDays(1));
        attendance.setCheckInAt(LocalDateTime.now().minusDays(1).minusHours(8));
        attendance.setCheckOutAt(LocalDateTime.now().minusDays(1));
        when(attendanceRepository.findByEmployeeIdOrderByAttendanceDateDesc(7L)).thenReturn(List.of(attendance));

        var result = attendanceService.getMyAttendance(7L);

        assertThat(result).singleElement().satisfies(response -> {
            assertThat(response.getEmployeeId()).isEqualTo(7L);
            assertThat(response.getWorkedMinutes()).isGreaterThanOrEqualTo(479);
        });
    }
}
