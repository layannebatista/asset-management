package com.portfolio.assetmanagement.domain.mfa.entity;

import jakarta.persistence.*;
import java.security.SecureRandom;
import java.time.Instant;

/**
 * Código OTP de segundo fator (MFA) enviado via WhatsApp.
 *
 * <p>Gerado no momento do login quando o usuário tem {@code phoneNumber} cadastrado. Válido por
 * {@code expirationSeconds} segundos (padrão: 300s / 5 min). Cada uso ou expiração invalida o
 * código permanentemente.
 */
@Entity
@Table(name = "mfa_codes")
public class MfaCode {

  private static final SecureRandom SECURE_RANDOM = new SecureRandom();

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "user_id", nullable = false)
  private Long userId;

  @Column(nullable = false, length = 10)
  private String code;

  @Column(nullable = false)
  private boolean used;

  @Column(name = "expires_at", nullable = false)
  private Instant expiresAt;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  protected MfaCode() {}

  public MfaCode(Long userId, int codeLength, long expirationSeconds) {

    if (userId == null) throw new IllegalArgumentException("userId é obrigatório");

    this.userId = userId;
    this.code = generateCode(codeLength);
    this.used = false;
    this.createdAt = Instant.now();
    this.expiresAt = createdAt.plusSeconds(expirationSeconds);
  }

  /** Gera código numérico com o comprimento especificado. */
  private static String generateCode(int length) {
    int bound = (int) Math.pow(10, length);
    String raw = String.valueOf(SECURE_RANDOM.nextInt(bound));
    // zero-padding para garantir comprimento fixo
    return String.format("%0" + length + "d", Integer.parseInt(raw));
  }

  public boolean isValid() {
    return !used && Instant.now().isBefore(expiresAt);
  }

  public void markAsUsed() {
    this.used = true;
  }

  public Long getId() {
    return id;
  }

  public Long getUserId() {
    return userId;
  }

  public String getCode() {
    return code;
  }

  public boolean isUsed() {
    return used;
  }

  public Instant getExpiresAt() {
    return expiresAt;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }
}
