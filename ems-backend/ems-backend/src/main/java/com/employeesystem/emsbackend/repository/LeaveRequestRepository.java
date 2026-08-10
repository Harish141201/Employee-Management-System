package com.employeesystem.emsbackend.repository;

import com.employeesystem.emsbackend.entity.LeaveRequest;
import com.employeesystem.emsbackend.entity.LeaveStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {

    List<LeaveRequest> findByEmployeeIdOrderByAppliedAtDesc(Long employeeId);

    // Direct reports of a given manager — powers the "my team's requests" view.
    List<LeaveRequest> findByEmployee_Manager_IdOrderByAppliedAtDesc(Long managerId);

    List<LeaveRequest> findByStatusOrderByAppliedAtDesc(LeaveStatus status);

    List<LeaveRequest> findAllByOrderByAppliedAtDesc();

    long countByStatus(LeaveStatus status);

    long countByEmployeeId(Long employeeId);

    // Standard interval-overlap check: an existing request overlaps
    // [newStart, newEnd] if existingStart <= newEnd AND existingEnd >= newStart.
    // Written as an explicit query (rather than a derived method name) since
    // a long AND-chained method name here would be easy to get the parameter
    // order wrong on without it being obvious at the call site.
    @Query("SELECT lr FROM LeaveRequest lr WHERE lr.employee.id = :employeeId " +
           "AND lr.status IN :statuses " +
           "AND lr.startDate <= :newEnd AND lr.endDate >= :newStart")
    List<LeaveRequest> findOverlapping(@Param("employeeId") Long employeeId,
                                        @Param("statuses") List<LeaveStatus> statuses,
                                        @Param("newStart") LocalDate newStart,
                                        @Param("newEnd") LocalDate newEnd);
}
