package com.portfolio.asset_management.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class JwtService {

    private static final String SECRET =
            "minha-chave-super-secreta-para-gestao-de-ativos-123456";

    private final Key key = Keys.hmacShaKeyFor(SECRET.getBytes());

    public String generateToken(UUID userId, List<Role> roles) {
        return Jwts.builder()
                .setSubject(userId.toString())
                .claim(
                        "roles",
                        roles.stream().map(Enum::name).collect(Collectors.toList())
                )
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 86400000)) // 1 dia
                .signWith(key)
                .compact();
    }

    public boolean isTokenValid(String token) {
        try {
            getClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public UUID getUserId(String token) {
        return UUID.fromString(getClaims(token).getSubject());
    }

    @SuppressWarnings("unchecked")
    public List<Role> getRoles(String token) {
        List<String> roles =
                (List<String>) getClaims(token).get("roles");
        return roles.stream()
                .map(Role::valueOf)
                .collect(Collectors.toList());
    }

    private Claims getClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
