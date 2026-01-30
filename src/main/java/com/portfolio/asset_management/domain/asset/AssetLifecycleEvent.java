package com.portfolio.asset_management.domain.asset;

import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;

/**
 * Evento de ciclo de vida do Asset.
 *
 * Representa uma mudança relevante de estado ou ação de negócio
 * executada sobre um ativo.
 *
 * Este evento é utilizado para:
 * - auditoria
 * - histórico
 * - cenários BDD
 * - rastreabilidade de processos (transferência, inventário, etc.)
 */
public class AssetLifecycleEvent {

  private UUID id;

  private UUID assetId;

  private AssetStatus previousStatus;
  private AssetStatus newStatus;

  private AssetAction action;

  /**
   * Identificador do processo relacionado ao evento.
   * Ex: transferência, inventário, manutenção.
   */
  private UUID processId;

  /**
   * Usuário ou sistema que disparou a ação.
   */
  private UUID triggeredBy;

  /**
   * Contexto livre para auditoria.
   * Pode armazenar motivo, observação ou metadado simples.
   */
  private String context;

  private LocalDateTime occurredAt;

  protected AssetLifecycleEvent() {
    // construtor protegido para JPA
  }

  private AssetLifecycleEvent(
      UUID assetId,
      AssetStatus previousStatus,
      AssetStatus newStatus,
      AssetAction action,
      UUID processId,
      UUID triggeredBy,
      String context,
      LocalDateTime occurredAt) {

    this.assetId = assetId;
    this.previousStatus = previousStatus;
    this.newStatus = newStatus;
    this.action = action;
    this.processId = processId;
    this.triggeredBy = triggeredBy;
    this.context = context;
    this.occurredAt = occurredAt;
  }

  /* ======================================================
     FACTORY METHODS (PADRÃO DE MERCADO)
     ====================================================== */

  public static AssetLifecycleEvent create(
      UUID assetId,
      AssetStatus previousStatus,
      AssetStatus newStatus,
      AssetAction action,
      UUID triggeredBy,
      String context) {

    return create(
        assetId,
        previousStatus,
        newStatus,
        action,
        null,
        triggeredBy,
        context
    );
  }

  public static AssetLifecycleEvent create(
      UUID assetId,
      AssetStatus previousStatus,
      AssetStatus newStatus,
      AssetAction action,
      UUID processId,
      UUID triggeredBy,
      String context) {

    if (assetId == null) {
      throw new IllegalArgumentException("AssetId é obrigatório para evento de lifecycle");
    }
    if (newStatus == null) {
      throw new IllegalArgumentException("Novo status é obrigatório para evento de lifecycle");
    }
    if (action == null) {
      throw new IllegalArgumentException("Ação é obrigatória para evento de lifecycle");
    }

    return new AssetLifecycleEvent(
        assetId,
        previousStatus,
        newStatus,
        action,
        processId,
        triggeredBy,
        context,
        LocalDateTime.now()
    );
  }

  /* ======================================================
     GETTERS
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

  public AssetAction getAction() {
    return action;
  }

  public UUID getProcessId() {
    return processId;
  }

  public UUID getTriggeredBy() {
    return triggeredBy;
  }

  public String getContext() {
    return context;
  }

  public LocalDateTime getOccurredAt() {
    return occurredAt;
  }

  /* ======================================================
     EQUALS & HASHCODE
     ====================================================== */

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (!(o instanceof AssetLifecycleEvent)) return false;
    AssetLifecycleEvent that = (AssetLifecycleEvent) o;
    return Objects.equals(id, that.id);
  }

  @Override
  public int hashCode() {
    return Objects.hash(id);
  }
}
