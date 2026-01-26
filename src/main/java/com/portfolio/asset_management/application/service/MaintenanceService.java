package com.portfolio.asset_management.application.service;

import com.portfolio.asset_management.domain.asset.Asset;
import com.portfolio.asset_management.domain.asset.AssetLifecycleEvent;
import com.portfolio.asset_management.domain.asset.AssetStatus;
import com.portfolio.asset_management.domain.maintenance.Maintenance;
import com.portfolio.asset_management.domain.maintenance.MaintenanceStatus;
import com.portfolio.asset_management.infrastructure.persistence.AssetLifecycleRepository;
import com.portfolio.asset_management.infrastructure.persistence.AssetRepository;
import com.portfolio.asset_management.infrastructure.persistence.MaintenanceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class MaintenanceService {

    private final AssetRepository assetRepository;
    private final MaintenanceRepository maintenanceRepository;
    private final AssetLifecycleRepository assetLifecycleRepository;

    public MaintenanceService(
            AssetRepository assetRepository,
            MaintenanceRepository maintenanceRepository,
            AssetLifecycleRepository assetLifecycleRepository
    ) {
        this.assetRepository = assetRepository;
        this.maintenanceRepository = maintenanceRepository;
        this.assetLifecycleRepository = assetLifecycleRepository;
    }

    /* ======================================================
       ABRIR MANUTENÇÃO
       ====================================================== */

    @Transactional
    public Maintenance openMaintenance(
            UUID assetId,
            String description,
            UUID openedBy
    ) {
        Asset asset = assetRepository.findById(assetId)
                .orElseThrow(() -> new IllegalStateException("Ativo não encontrado"));

        if (asset.getStatus() != AssetStatus.EM_USO) {
            throw new IllegalStateException("Ativo não pode entrar em manutenção");
        }

        boolean hasActiveMaintenance =
                maintenanceRepository.existsByAssetIdAndStatusIn(
                        assetId,
                        List.of(MaintenanceStatus.ABERTA, MaintenanceStatus.EM_EXECUCAO)
                );

        if (hasActiveMaintenance) {
            throw new IllegalStateException("Já existe manutenção ativa para este ativo");
        }

        asset.sendToMaintenance();
        assetRepository.save(asset);

        Maintenance maintenance =
                Maintenance.open(assetId, description, openedBy);

        maintenanceRepository.save(maintenance);

        AssetLifecycleEvent event = AssetLifecycleEvent.ofStatusChange(
                asset.getId(),
                AssetStatus.EM_USO,
                AssetStatus.EM_MANUTENCAO,
                "MAINTENANCE_OPENED",
                openedBy,
                description
        );

        assetLifecycleRepository.save(event);

        return maintenance;
    }

    /* ======================================================
       INICIAR MANUTENÇÃO
       ====================================================== */

    @Transactional
    public void startMaintenance(UUID maintenanceId) {
        Maintenance maintenance = maintenanceRepository.findById(maintenanceId)
                .orElseThrow(() -> new IllegalStateException("Manutenção não encontrada"));

        maintenance.start();
        maintenanceRepository.save(maintenance);
    }

    /* ======================================================
       FINALIZAR MANUTENÇÃO
       ====================================================== */

    @Transactional
    public void finishMaintenance(UUID maintenanceId, UUID finishedBy) {
        Maintenance maintenance = maintenanceRepository.findById(maintenanceId)
                .orElseThrow(() -> new IllegalStateException("Manutenção não encontrada"));

        maintenance.finish();
        maintenanceRepository.save(maintenance);

        Asset asset = assetRepository.findById(maintenance.getAssetId())
                .orElseThrow(() -> new IllegalStateException("Ativo não encontrado"));

        AssetStatus previousStatus = asset.getStatus();

        asset.returnFromMaintenance();
        assetRepository.save(asset);

        AssetLifecycleEvent event = AssetLifecycleEvent.ofStatusChange(
                asset.getId(),
                previousStatus,
                AssetStatus.EM_USO,
                "MAINTENANCE_FINISHED",
                finishedBy,
                null
        );

        assetLifecycleRepository.save(event);
    }

    /* ======================================================
       CANCELAR MANUTENÇÃO
       ====================================================== */

    @Transactional
    public void cancelMaintenance(UUID maintenanceId, UUID canceledBy, String reason) {
        Maintenance maintenance = maintenanceRepository.findById(maintenanceId)
                .orElseThrow(() -> new IllegalStateException("Manutenção não encontrada"));

        maintenance.cancel(reason);
        maintenanceRepository.save(maintenance);

        Asset asset = assetRepository.findById(maintenance.getAssetId())
                .orElseThrow(() -> new IllegalStateException("Ativo não encontrado"));

        AssetStatus previousStatus = asset.getStatus();

        asset.returnFromMaintenance();
        assetRepository.save(asset);

        AssetLifecycleEvent event = AssetLifecycleEvent.ofStatusChange(
                asset.getId(),
                previousStatus,
                AssetStatus.EM_USO,
                "MAINTENANCE_CANCELED",
                canceledBy,
                reason
        );

        assetLifecycleRepository.save(event);
    }
}
