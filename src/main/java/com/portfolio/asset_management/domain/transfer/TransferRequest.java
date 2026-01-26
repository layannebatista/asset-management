package com.portfolio.asset_management.domain.transfer;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Representa uma solicitação formal de transferência de um ativo.
 *
 * Essa entidade NÃO altera o ativo diretamente.
 * Ela representa apenas o processo de decisão.
 */
@Entity
@Table(name = "transfer_requests")
public class TransferRequest {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "asset_id", nullable = false)
    private UUID assetId;

    @Column(name = "from_unit_id", nullable = false)
    private UUID fromUnitId;

    @Column(name = "to_unit_id", nullable = false)
    private UUID toUnitId;

    @Column(name = "from_responsible_user_id", nullable = false)
    private UUID fromResponsibleUserId;

    @Column(name = "to_responsible_user_id", nullable = false)
    private UUID toResponsibleUserId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TransferStatus status;

    @Column(name = "requested_by", nullable = false)
    private UUID requestedBy;

    @Column(name = "requested_at", nullable = false, updatable = false)
    private LocalDateTime requestedAt;

    @Column(name = "decision_at")
    private LocalDateTime decisionAt;

    @Column(name = "decision_by")
    private UUID decisionBy;

    @Column(name = "decision_reason", length = 255)
    private String decisionReason;

    protected TransferRequest() {
        // JPA only
    }

    private TransferRequest(
            UUID assetId,
            UUID fromUnitId,
            UUID toUnitId,
            UUID fromResponsibleUserId,
            UUID toResponsibleUserId,
            UUID requestedBy
    ) {
        this.assetId = assetId;
        this.fromUnitId = fromUnitId;
        this.toUnitId = toUnitId;
        this.fromResponsibleUserId = fromResponsibleUserId;
        this.toResponsibleUserId = toResponsibleUserId;
        this.requestedBy = requestedBy;
        this.status = TransferStatus.PENDENTE;
        this.requestedAt = LocalDateTime.now();
    }

    /* ======================================================
       FÁBRICA (CRIAÇÃO)
       ====================================================== */

    public static TransferRequest create(
            UUID assetId,
            UUID fromUnitId,
            UUID toUnitId,
            UUID fromResponsibleUserId,
            UUID toResponsibleUserId,
            UUID requestedBy
    ) {
        return new TransferRequest(
                assetId,
                fromUnitId,
                toUnitId,
                fromResponsibleUserId,
                toResponsibleUserId,
                requestedBy
        );
    }

    /* ======================================================
       TRANSIÇÕES DE ESTADO
       ====================================================== */

    public void approve(UUID approverId) {
        ensurePending();
        this.status = TransferStatus.APROVADA;
        this.decisionBy = approverId;
        this.decisionAt = LocalDateTime.now();
    }

    public void reject(UUID approverId, String reason) {
        ensurePending();
        this.status = TransferStatus.REJEITADA;
        this.decisionBy = approverId;
        this.decisionReason = reason;
        this.decisionAt = LocalDateTime.now();
    }

    public void cancel(UUID requesterId, String reason) {
        ensurePending();
        this.status = TransferStatus.CANCELADA;
        this.decisionBy = requesterId;
        this.decisionReason = reason;
        this.decisionAt = LocalDateTime.now();
    }

    /* ======================================================
       REGRAS INTERNAS
       ====================================================== */

    private void ensurePending() {
        if (this.status != TransferStatus.PENDENTE) {
            throw new IllegalStateException(
                    "Transferência não pode ser alterada. Estado atual: " + status
            );
        }
    }

    /* ======================================================
       GETTERS (SOMENTE LEITURA)
       ====================================================== */

    public UUID getId() {
        return id;
    }

    public UUID getAssetId() {
        return assetId;
    }

    public UUID getFromUnitId() {
        return fromUnitId;
    }

    public UUID getToUnitId() {
        return toUnitId;
    }

    public UUID getFromResponsibleUserId() {
        return fromResponsibleUserId;
    }

    public UUID getToResponsibleUserId() {
        return toResponsibleUserId;
    }

    public TransferStatus getStatus() {
        return status;
    }

    public UUID getRequestedBy() {
        return requestedBy;
    }

    public LocalDateTime getRequestedAt() {
        return requestedAt;
    }

    public LocalDateTime getDecisionAt() {
        return decisionAt;
    }

    public UUID getDecisionBy() {
        return decisionBy;
    }

    public String getDecisionReason() {
        return decisionReason;
    }
}
