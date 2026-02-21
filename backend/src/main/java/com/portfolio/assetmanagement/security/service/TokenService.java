package com.portfolio.assetmanagement.security.service;

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

  private final Key key;

  private final long expiration;

  public TokenService(
      UserDetailsService userDetailsService,
      @Value("${security.jwt.secret}") String secret,
      @Value("${security.jwt.expiration}") long expiration) {

    if (secret == null || secret.length() < 32) {
      throw new IllegalStateException(
          "security.jwt.secret deve ter pelo menos 32 caracteres para segurança adequada");
    }

    this.userDetailsService = userDetailsService;
    this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    this.expiration = expiration;
  }

  /** Gera token JWT seguro. */
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

  /** Valida token JWT com verificação completa. */
  public boolean isTokenValid(String token) {

    try {

      Claims claims = extractAllClaims(token);

      return !isTokenExpired(claims);

    } catch (JwtException | IllegalArgumentException ex) {

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
