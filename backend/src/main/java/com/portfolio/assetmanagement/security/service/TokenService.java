package com.portfolio.assetmanagement.security.service;

import com.portfolio.assetmanagement.domain.user.entity.User;
import com.portfolio.assetmanagement.infrastructure.persistence.user.repository.UserRepository;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Service;

@Service
public class TokenService {

  private final UserDetailsService userDetailsService;
  private final UserRepository userRepository;

  private final Key key;
  private final long expiration;

  public TokenService(
      UserDetailsService userDetailsService,
      UserRepository userRepository,
      @Value("${security.jwt.secret}") String secret,
      @Value("${security.jwt.expiration}") long expiration) {

    if (secret == null || secret.length() < 32) {
      throw new IllegalStateException(
          "security.jwt.secret deve ter pelo menos 32 caracteres para segurança adequada");
    }

    this.userDetailsService = userDetailsService;
    this.userRepository = userRepository;
    this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    this.expiration = expiration;
  }

  /**
   * Gera token JWT com claims completos do usuário.
   *
   * Inclui role, userId, organizationId e unitId para que o frontend
   * consiga reidratar o contexto de autenticação sem precisar chamar a API.
   */
  public String generateToken(UserDetails userDetails) {
    Date now = new Date();
    Date expiryDate = new Date(now.getTime() + expiration);

    JwtBuilder builder = Jwts.builder()
        .setSubject(userDetails.getUsername())
        .setIssuedAt(now)
        .setExpiration(expiryDate);

    // Adiciona claims do usuário se encontrado no banco
    userRepository.findByEmail(userDetails.getUsername()).ifPresent(user -> {
      builder.claim("role", user.getRole().name());
      builder.claim("userId", user.getId());
      if (user.getOrganization() != null) {
        builder.claim("organizationId", user.getOrganization().getId());
      }
      if (user.getUnit() != null) {
        builder.claim("unitId", user.getUnit().getId());
      }
    });

    return builder.signWith(key, SignatureAlgorithm.HS256).compact();
  }

  /** Valida token JWT com verificação completa. */
  public boolean isTokenValid(String token) {
    try {
      Claims claims = extractAllClaims(token);
      return !isTokenExpired(claims);
    } catch (Exception ex) { // 🔥 aqui está a correção
      return false;
    }
  }

  /** Obtém UserDetails do token. */
  public UserDetails getUserDetails(String token) {
    String username = extractUsername(token);
    if (username == null) {
      throw new BadCredentialsException("Token inválido: username ausente");
    }
    return userDetailsService.loadUserByUsername(username);
  }

  /** Extrai username do token. */
  public String extractUsername(String token) {
    return extractAllClaims(token).getSubject();
  }

  /** Verifica se token expirou. */
  public boolean isTokenExpired(String token) {
    return isTokenExpired(extractAllClaims(token));
  }

  private boolean isTokenExpired(Claims claims) {
    return claims.getExpiration().before(new Date());
  }

  /** Extrai claims com validação segura. */
  private Claims extractAllClaims(String token) {
    try {
      return Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token).getBody();
    } catch (ExpiredJwtException ex) {
      throw new BadCredentialsException("Token expirado", ex);
    } catch (UnsupportedJwtException ex) {
      throw new BadCredentialsException("Token não suportado", ex);
    } catch (MalformedJwtException ex) {
      throw new BadCredentialsException("Token malformado", ex);
    } catch (SignatureException ex) {
      throw new BadCredentialsException("Assinatura inválida", ex);
    } catch (IllegalArgumentException ex) {
      throw new BadCredentialsException("Token inválido", ex);
    }
  }
}