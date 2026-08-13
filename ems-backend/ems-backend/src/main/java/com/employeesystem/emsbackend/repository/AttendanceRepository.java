package com.employeesystem.emsbackend.repository;

import com.employeesystem.emsbackend.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    Optional<Attendance> findByEmployeeIdAndAttendanceDate(Long employeeId, LocalDate attendanceDate);
    List<Attendance> findByEmployeeIdOrderByAttendanceDateDesc(Long employeeId);
    List<Attendance> findAllByOrderByAttendanceDateDesc();

    @Query("select a from Attendance a where (:employeeId is null or a.employee.id = :employeeId) " +
            "and (:fromDate is null or a.attendanceDate >= :fromDate) " +
            "and (:toDate is null or a.attendanceDate <= :toDate) " +
            "order by a.attendanceDate desc, a.employee.firstName asc")
    List<Attendance> findAllFiltered(@Param("employeeId") Long employeeId,
                                     @Param("fromDate") LocalDate fromDate,
                                     @Param("toDate") LocalDate toDate);
}
