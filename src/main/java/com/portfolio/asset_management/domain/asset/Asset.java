package com.portfolio.asset_management.domain.asset;

import jakarta.persistence.*;
import java.util.Objects;
import java.util.UUID;

/**
 * Entidade de domínio Asset.
 *
 * Responsável por:
 * - manter o estado atual do ativo
 * - aplicar regras de negócio
 * - governar o lifecycle
 *
 * Todas as transições acontecem por ações explícitas.
 * Nenhuma alteração direta de status é permitida.
 */
@Entity
@Table(name = "assets")
public class Asset {

  @Id
  @GeneratedValue
  @Column(nullable = false, updatable = false)
  private UUID id;

  @Column(nullable = false, unique = true)
  private String assetCode;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private AssetStatus status;

  @Column
  private UUID unitId;

  @Column
  private UUID responsibleUserId;

  @Column(nullable = false)
  private boolean transferenciaEmAndamento;

  @Column(nullable = false)
  private boolean inventarioEmAndamento;

  @Column
  private String writeOffReason;

  protected Asset() {
    // construtor protegido exigido pelo JPA
  }

  public Asset(String assetCode) {
    if (assetCode == null || assetCode.isBlank()) {
      throw new IllegalArgumentException("Código do ativo é obrigatório");
    }
    this.assetCode = assetCode;
    this.status = AssetStatus.CADASTRADO;
  }

  /* ======================================================
     AÇÕES DE NEGÓCIO — LIFECYCLE
     ====================================================== */

  public void ativar(UUID unitId, UUID responsibleUserId) {
    assertActionAllowed(AssetAction.ATIVAR);

    if (unitId == null) {
      throw new IllegalStateException("Unidade é obrigatória para ativar o ativo");
    }
    if (responsibleUserId == null) {
      throw new IllegalStateException("Responsável é obrigatório para ativar o ativo");
    }

    this.unitId = unitId;
    this.responsibleUserId = responsibleUserId;
    this.status = AssetStatus.EM_USO;
  }

  /* ===================== TRANSFERÊNCIA ===================== */

  public void solicitarTransferencia() {
    assertActionAllowed(AssetAction.SOLICITAR_TRANSFERENCIA);
    assertNoProcessInProgress();

    this.transferenciaEmAndamento = true;
    this.status = AssetStatus.TRANSFERENCIA_SOLICITADA;
  }

  public void aprovarTransferencia() {
    assertActionAllowed(AssetAction.APROVAR_TRANSFERENCIA);
    assertTransferenciaEmAndamento();

    this.status = AssetStatus.TRANSFERENCIA_APROVADA;
  }

  public void rejeitarTransferencia() {
    assertActionAllowed(AssetAction.REJEITAR_TRANSFERENCIA);
    assertTransferenciaEmAndamento();

    this.transferenciaEmAndamento = false;
    this.status = AssetStatus.EM_USO;
  }

  public void confirmarRecebimento(
      UUID newUnitId,
      UUID newResponsibleUserId) {

    assertActionAllowed(AssetAction.CONFIRMAR_RECEBIMENTO);
    assertTransferenciaEmAndamento();

    if (newUnitId == null || newResponsibleUserId == null) {
      throw new IllegalStateException(
          "Unidade e responsável de destino são obrigatórios");
    }

    this.unitId = newUnitId;
    this.responsibleUserId = newResponsibleUserId;
    this.transferenciaEmAndamento = false;
    this.status = AssetStatus.EM_USO;
  }

  /* ===================== MANUTENÇÃO ===================== */

  public void enviarParaManutencao() {
    assertActionAllowed(AssetAction.ENVIAR_PARA_MANUTENCAO);
    assertNoProcessInProgress();

    this.status = AssetStatus.EM_MANUTENCAO;
  }

  public void retornarDaManutencao() {
    assertActionAllowed(AssetAction.RETORNAR_DA_MANUTENCAO);
    this.status = AssetStatus.EM_USO;
  }

  /* ===================== INVENTÁRIO ===================== */

  public void iniciarInventario() {
    assertActionAllowed(AssetAction.INICIAR_INVENTARIO);
    assertNoProcessInProgress();

    this.inventarioEmAndamento = true;
    this.status = AssetStatus.EM_INVENTARIO;
  }

  public void confirmarLocalizado() {
    assertActionAllowed(AssetAction.CONFIRMAR_LOCALIZADO);
    assertInventarioEmAndamento();

    this.inventarioEmAndamento = false;
    this.status = AssetStatus.EM_USO;
  }

  public void marcarNaoLocalizado() {
    assertActionAllowed(AssetAction.MARCAR_NAO_LOCALIZADO);
    assertInventarioEmAndamento();

    this.inventarioEmAndamento = false;
    this.status = AssetStatus.NAO_LOCALIZADO;
  }

  public void localizarAtivo() {
    assertActionAllowed(AssetAction.LOCALIZAR_ATIVO);
    this.status = AssetStatus.EM_USO;
  }

  /* ===================== BAIXA ===================== */

  public void baixar(String reason) {
    assertActionAllowed(AssetAction.BAIXAR);

    if (reason == null || reason.isBlank()) {
      throw new IllegalStateException("Motivo da baixa é obrigatório");
    }

    this.writeOffReason = reason;
    this.status = AssetStatus.BAIXADO;
  }

  /* ======================================================
     VALIDAÇÕES DE DOMÍNIO
     ====================================================== */

  private void assertActionAllowed(AssetAction action) {
    if (!status.permite(action)) {
      throw new IllegalStateException(
          "Ação '" + action + "' não permitida para o status atual: " + status);
    }
  }

  private void assertNoProcessInProgress() {
    if (transferenciaEmAndamento || inventarioEmAndamento) {
      throw new IllegalStateException(
          "Ativo possui um processo em andamento e não pode executar esta ação");
    }
  }

  private void assertTransferenciaEmAndamento() {
    if (!transferenciaEmAndamento) {
      throw new IllegalStateException("Não existe transferência em andamento");
    }
  }

  private void assertInventarioEmAndamento() {
    if (!inventarioEmAndamento) {
      throw new IllegalStateException("Não existe inventário em andamento");
    }
  }

  /* ======================================================
     GETTERS (SEM SETTERS)
     ====================================================== */

  public UUID getId() {
    return id;
  }

  public String getAssetCode() {
    return assetCode;
  }

  public AssetStatus getStatus() {
    return status;
  }

  public UUID getUnitId() {
    return unitId;
  }

  public UUID getResponsibleUserId() {
    return responsibleUserId;
  }

  public boolean isTransferenciaEmAndamento() {
    return transferenciaEmAndamento;
  }

  public boolean isInventarioEmAndamento() {
    return inventarioEmAndamento;
  }

  public String getWriteOffReason() {
    return writeOffReason;
  }

  /* ======================================================
     EQUALS & HASHCODE
     ====================================================== */

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (!(o instanceof Asset)) return false;
    Asset asset = (Asset) o;
    return Objects.equals(id, asset.id);
  }

  @Override
  public int hashCode() {
    return Objects.hash(id);
  }
}
