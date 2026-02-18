package com.portfolio.assetmanagement.domain.user.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_consents")
public class UserConsent {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private Long userId;

  @Column(nullable = false)
  private boolean lgpdAccepted;

  @Column(nullable = false)
  private LocalDateTime acceptedAt;

  protected UserConsent() {}

  public UserConsent(Long userId) {
    this.userId = userId;
    this.lgpdAccepted = true;
    this.acceptedAt = LocalDateTime.now();
  }

  public Long getUserId() {
    return userId;
  }

  public boolean isLgpdAccepted() {
    return lgpdAccepted;
  }

  public LocalDateTime getAcceptedAt() {
    return acceptedAt;
  }
}
