package com.employeesystem.emsbackend.entity;
import jakarta.persistence.*; import lombok.*; import java.time.LocalDate;
@Getter @Setter @NoArgsConstructor @Entity @Table(name="calendar_events") public class CalendarEvent {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(nullable=false,length=120) private String title;
 @Column(nullable=false) private LocalDate eventDate;
 @Enumerated(EnumType.STRING) @Column(nullable=false,length=20) private CalendarEventType type;
 @Column(length=500) private String description;
}
