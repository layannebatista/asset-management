package com.portfolio.asset_management.user.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/**
 * Token de ativação de usuário.
 *
 * <p>Usado para ativação segura de contas.
 */
@Entity
@Table(name = "user_activation_tokens")
public class UserActivationToken {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true, length = 100)
  private String token;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @Column(name = "expires_at", nullable = false)
  private Instant expiresAt;

  @Column(name = "used", nullable = false)
  private boolean used;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  protected UserActivationToken() {}

  public UserActivationToken(User user, long expirationSeconds) {

    if (user == null || user.getId() == null) {
      throw new IllegalArgumentException("User é obrigatório");
    }

    this.user = user;

    this.token = UUID.randomUUID().toString();

    this.createdAt = Instant.now();

    this.expiresAt = createdAt.plusSeconds(expirationSeconds);

    this.used = false;
  }

  public Long getId() {
    return id;
  }

  public String getToken() {
    return token;
  }

  public User getUser() {
    return user;
  }

  public Instant getExpiresAt() {
    return expiresAt;
  }

  public boolean isUsed() {
    return used;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  /** Marca token como usado. */
  public void markAsUsed() {

    this.used = true;
  }

  /** Verifica se token expirou. */
  public boolean isExpired() {

    return Instant.now().isAfter(expiresAt);
  }

  /** Verifica se token é válido. */
  public boolean isValid() {

    return !used && !isExpired();
  }

  @Override
  public boolean equals(Object o) {

    if (this == o) return true;

    if (!(o instanceof UserActivationToken that)) return false;

    return id != null && id.equals(that.id);
  }

  @Override
  public int hashCode() {

    return Objects.hash(id);
  }
}
