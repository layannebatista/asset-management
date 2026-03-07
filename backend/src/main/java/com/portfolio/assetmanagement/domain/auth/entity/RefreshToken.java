package com.portfolio.assetmanagement.domain.auth.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Token de renovação de JWT (Refresh Token).
 *
 * <p>Permite que o cliente renove o access token sem refazer login, desde que o refresh token ainda
 * seja válido.
 *
 * <p>Vida útil padrão: 7 dias. Access token: 1 hora. Rotação automática: cada uso gera um novo
 * token e revoga o anterior.
 */
@Entity
@Table(name = "refresh_tokens")
public class RefreshToken {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "user_id", nullable = false)
  private Long userId;

  @Column(nullable = false, unique = true, length = 255)
  private String token;

  @Column(name = "expires_at", nullable = false)
  private Instant expiresAt;

  @Column(nullable = false)
  private boolean revoked;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  protected RefreshToken() {}

  public RefreshToken(Long userId, long expirationSeconds) {
    if (userId == null) throw new IllegalArgumentException("userId é obrigatório");
    this.userId = userId;
    this.token = UUID.randomUUID().toString();
    this.createdAt = Instant.now();
    this.expiresAt = createdAt.plusSeconds(expirationSeconds);
    this.revoked = false;
  }

  public boolean isValid() {
    return !revoked && Instant.now().isBefore(expiresAt);
  }

  public void revoke() {
    this.revoked = true;
  }

  public Long getId() {
    return id;
  }

  public Long getUserId() {
    return userId;
  }

  public String getToken() {
    return token;
  }

  public Instant getExpiresAt() {
    return expiresAt;
  }

  public boolean isRevoked() {
    return revoked;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }
}
