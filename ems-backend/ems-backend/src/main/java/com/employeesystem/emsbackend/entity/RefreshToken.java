package com.employeesystem.emsbackend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * Server-side record backing the refresh-token flow. The access token
 * (JWT) is stateless and short-lived by design — it can't be revoked
 * before it expires. This table is what actually makes "logout" and
 * "revoke this session" mean something: delete the row, and the refresh
 * token stops working immediately, even though any already-issued access
 * token keeps working for its own short remaining lifetime.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "refresh_tokens")
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 255)
    private String token;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private Instant expiryDate;
}
