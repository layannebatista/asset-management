package com.portfolio.asset_management.security.service;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Service;

@Service
public class TokenService {

  private final UserDetailsService userDetailsService;

  private final Key key;

  private final long expiration;

  public TokenService(
      UserDetailsService userDetailsService,
      @Value("${security.jwt.secret}") String secret,
      @Value("${security.jwt.expiration}") long expiration) {

    this.userDetailsService = userDetailsService;
    this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    this.expiration = expiration;
  }

  public String generateToken(UserDetails userDetails) {

    Date now = new Date();

    Date expiryDate = new Date(now.getTime() + expiration);

    return Jwts.builder()
        .setSubject(userDetails.getUsername())
        .setIssuedAt(now)
        .setExpiration(expiryDate)
        .signWith(key, SignatureAlgorithm.HS256)
        .compact();
  }

  public boolean isTokenValid(String token) {

    try {

      Claims claims = extractAllClaims(token);

      return !claims.getExpiration().before(new Date());

    } catch (JwtException | IllegalArgumentException ex) {

      return false;
    }
  }

  public UserDetails getUserDetails(String token) {

    String username = extractUsername(token);

    return userDetailsService.loadUserByUsername(username);
  }

  public String extractUsername(String token) {

    return extractAllClaims(token).getSubject();
  }

  private Claims extractAllClaims(String token) {

    return Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token).getBody();
  }
}
