package com.portfolio.asset_management.domain.asset;

import com.portfolio.asset_management.domain.shared.VersionedEntity;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "assets")
public class Asset extends VersionedEntity {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false, unique = true, length = 100)
    private String assetCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private AssetStatus status;

    @Column(name = "unit_id")
    private UUID unitId;

    @Column(name = "responsible_user_id")
    private UUID responsibleUserId;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime lastStatusChangeAt;

    protected Asset() {
        // JPA only
    }

    public Asset(String assetCode) {
        this.assetCode = assetCode;
        this.status = AssetStatus.CADASTRADO;
        this.createdAt = LocalDateTime.now();
        this.lastStatusChangeAt = this.createdAt;
    }

    /* ======================================================
       TRANSIÇÕES DE ESTADO — ÚNICA FORMA DE MUDAR O ATIVO
       ====================================================== */

    public void activate(UUID unitId, UUID responsibleUserId) {
        ensureStatus(AssetStatus.CADASTRADO);
        this.unitId = unitId;
        this.responsibleUserId = responsibleUserId;
        changeStatus(AssetStatus.EM_USO);
    }

    public void startTransfer() {
        ensureStatus(AssetStatus.EM_USO);
        changeStatus(AssetStatus.EM_TRANSFERENCIA);
    }

    public void approveTransfer(UUID newUnitId, UUID newResponsibleUserId) {
        ensureStatus(AssetStatus.EM_TRANSFERENCIA);
        this.unitId = newUnitId;
        this.responsibleUserId = newResponsibleUserId;
        changeStatus(AssetStatus.EM_USO);
    }

    public void sendToMaintenance() {
        ensureStatus(AssetStatus.EM_USO);
        changeStatus(AssetStatus.EM_MANUTENCAO);
    }

    public void returnFromMaintenance() {
        ensureStatus(AssetStatus.EM_MANUTENCAO);
        changeStatus(AssetStatus.EM_USO);
    }

    public void markAsNotLocated() {
        ensureStatus(AssetStatus.EM_USO);
        changeStatus(AssetStatus.NAO_LOCALIZADO);
    }

    public void writeOff(String reason) {
        ensureNotFinalState();
        changeStatus(AssetStatus.BAIXADO);
    }

    /* ======================================================
       REGRAS INTERNAS
       ====================================================== */

    private void changeStatus(AssetStatus newStatus) {
        this.status = newStatus;
        this.lastStatusChangeAt = LocalDateTime.now();
    }

    private void ensureStatus(AssetStatus expected) {
        if (this.status != expected) {
            throw new IllegalStateException(
                    "Transição inválida. Estado atual: " + status +
                    ", esperado: " + expected
            );
        }
    }

    private void ensureNotFinalState() {
        if (this.status == AssetStatus.BAIXADO) {
            throw new IllegalStateException(
                    "Ativo já está em estado final: BAIXADO"
            );
        }
    }

    /* ======================================================
       GETTERS (SOMENTE LEITURA)
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getLastStatusChangeAt() {
        return lastStatusChangeAt;
    }
}
