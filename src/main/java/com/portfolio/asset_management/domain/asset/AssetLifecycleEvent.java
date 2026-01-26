package com.portfolio.asset_management.domain.asset;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Evento imutável que registra toda mudança relevante no ciclo de vida de um ativo.
 *
 * <p>Esse evento é usado para: - auditoria - histórico - compliance - rastreabilidade
 */
@Entity
@Table(name = "asset_lifecycle_events")
public class AssetLifecycleEvent {

  @Id @GeneratedValue private UUID id;

  @Column(name = "asset_id", nullable = false)
  private UUID assetId;

  @Enumerated(EnumType.STRING)
  @Column(name = "previous_status", nullable = false, length = 50)
  private AssetStatus previousStatus;

  @Enumerated(EnumType.STRING)
  @Column(name = "new_status", nullable = false, length = 50)
  private AssetStatus newStatus;

  @Column(name = "event_type", nullable = false, length = 100)
  private String eventType;

  @Column(name = "triggered_by")
  private UUID triggeredBy;

  @Column(name = "reason", length = 255)
  private String reason;

  @Column(name = "occurred_at", nullable = false, updatable = false)
  private LocalDateTime occurredAt;

  protected AssetLifecycleEvent() {
    // JPA only
  }

  private AssetLifecycleEvent(
      UUID assetId,
      AssetStatus previousStatus,
      AssetStatus newStatus,
      String eventType,
      UUID triggeredBy,
      String reason) {
    this.assetId = assetId;
    this.previousStatus = previousStatus;
    this.newStatus = newStatus;
    this.eventType = eventType;
    this.triggeredBy = triggeredBy;
    this.reason = reason;
    this.occurredAt = LocalDateTime.now();
  }

  /* ======================================================
  FÁBRICAS (ÚNICA FORMA DE CRIAR EVENTOS)
  ====================================================== */

  public static AssetLifecycleEvent ofStatusChange(
      UUID assetId,
      AssetStatus from,
      AssetStatus to,
      String eventType,
      UUID triggeredBy,
      String reason) {
    return new AssetLifecycleEvent(assetId, from, to, eventType, triggeredBy, reason);
  }

  /* ======================================================
  GETTERS (EVENTO É SOMENTE LEITURA)
  ====================================================== */

  public UUID getId() {
    return id;
  }

  public UUID getAssetId() {
    return assetId;
  }

  public AssetStatus getPreviousStatus() {
    return previousStatus;
  }

  public AssetStatus getNewStatus() {
    return newStatus;
  }

  public String getEventType() {
    return eventType;
  }

  public UUID getTriggeredBy() {
    return triggeredBy;
  }

  public String getReason() {
    return reason;
  }

  public LocalDateTime getOccurredAt() {
    return occurredAt;
  }
}
