package com.portfolio.asset_management.notification;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "notifications")
public class Notification {

  @Id @GeneratedValue private UUID id;

  @Column(nullable = false)
  private UUID userId;

  @Column(nullable = false, length = 50)
  private String channel; // EMAIL, WHATSAPP, SYSTEM

  @Column(nullable = false, length = 500)
  private String message;

  @Column(nullable = false)
  private boolean delivered = false;

  @Column(nullable = false)
  private LocalDateTime createdAt;

  @Column private LocalDateTime deliveredAt;

  protected Notification() {}

  public Notification(UUID userId, String channel, String message) {
    this.userId = userId;
    this.channel = channel;
    this.message = message;
    this.createdAt = LocalDateTime.now();
  }

  public void markDelivered() {
    this.delivered = true;
    this.deliveredAt = LocalDateTime.now();
  }

  public UUID getId() {
    return id;
  }
}
