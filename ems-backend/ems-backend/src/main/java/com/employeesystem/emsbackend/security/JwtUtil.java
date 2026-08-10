package com.employeesystem.emsbackend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.function.Function;

@Component
public class JwtUtil {

    // Must be at least 256 bits for HS256. Set via env var in production —
    // the default here is only for local dev convenience.
    @Value("${app.jwt.secret:this-is-a-local-dev-only-secret-change-me-before-deploying-anywhere-real}")
    private String jwtSecret;

    // Shorter now that a refresh-token flow exists to renew this — an
    // access token is meant to be short-lived precisely because it can't
    // be revoked before it expires. Default is 1 hour rather than the
    // more textbook 15 minutes, as a deliberate safety margin: this app's
    // frontend refresh flow hasn't been exercised against a live backend
    // in this environment, so a longer window reduces how often it needs
    // to fire during real use while still being a real improvement on the
    // previous 24-hour token.
    @Value("${app.jwt.expiration-ms:3600000}") // 1h default
    private long jwtExpirationMs;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    public String generateToken(UserDetails userDetails, Long employeeId) {
        String role = userDetails.getAuthorities().stream()
                .findFirst()
                .map(Object::toString)
                .orElse("ROLE_EMPLOYEE");

        var builder = Jwts.builder()
                .subject(userDetails.getUsername())
                .claim("role", role)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256);

        if (employeeId != null) {
            builder.claim("employeeId", employeeId);
        }
        return builder.compact();
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        String username = extractUsername(token);
        return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }
}
