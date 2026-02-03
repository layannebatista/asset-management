package com.portfolio.asset_management.security.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Service;

/**
 * Serviço responsável por geração, validação e leitura de tokens JWT.
 *
 * <p>Centraliza toda a lógica de autenticação baseada em token, isolando a biblioteca JWT do
 * restante da aplicação.
 */
@Service
public class TokenService {

  private final UserDetailsService userDetailsService;

  @Value("${security.jwt.secret}")
  private String secret;

  @Value("${security.jwt.expiration}")
  private long expiration;

  public TokenService(UserDetailsService userDetailsService) {
    this.userDetailsService = userDetailsService;
  }

  /** Gera token JWT a partir de um usuário autenticado. */
  public String generateToken(UserDetails userDetails) {

    Date now = new Date();
    Date expiryDate = new Date(now.getTime() + expiration);

    return Jwts.builder()
        .setSubject(userDetails.getUsername())
        .setIssuedAt(now)
        .setExpiration(expiryDate)
        .signWith(SignatureAlgorithm.HS256, secret.getBytes(StandardCharsets.UTF_8))
        .compact();
  }

  /** Verifica se o token é válido. */
  public boolean isTokenValid(String token) {
    try {
      Claims claims = extractAllClaims(token);
      return !claims.getExpiration().before(new Date());
    } catch (Exception ex) {
      return false;
    }
  }

  /** Retorna os detalhes do usuário contido no token. */
  public UserDetails getUserDetails(String token) {
    String username = extractUsername(token);
    return userDetailsService.loadUserByUsername(username);
  }

  /** Extrai o username (email) do token. */
  public String extractUsername(String token) {
    return extractAllClaims(token).getSubject();
  }

  private Claims extractAllClaims(String token) {
    return Jwts.parser()
        .setSigningKey(secret.getBytes(StandardCharsets.UTF_8))
        .parseClaimsJws(token)
        .getBody();
  }
}
