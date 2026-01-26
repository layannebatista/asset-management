package com.portfolio.asset_management.application.service;

import com.portfolio.asset_management.domain.asset.Asset;
import com.portfolio.asset_management.domain.asset.AssetLifecycleEvent;
import com.portfolio.asset_management.domain.asset.AssetStatus;
import com.portfolio.asset_management.domain.transfer.TransferApproval;
import com.portfolio.asset_management.domain.transfer.TransferRequest;
import com.portfolio.asset_management.domain.transfer.TransferStatus;
import com.portfolio.asset_management.infrastructure.persistence.AssetLifecycleRepository;
import com.portfolio.asset_management.infrastructure.persistence.AssetRepository;
import com.portfolio.asset_management.infrastructure.persistence.TransferApprovalRepository;
import com.portfolio.asset_management.infrastructure.persistence.TransferRequestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class TransferService {

    private final AssetRepository assetRepository;
    private final TransferRequestRepository transferRequestRepository;
    private final TransferApprovalRepository transferApprovalRepository;
    private final AssetLifecycleRepository assetLifecycleRepository;

    public TransferService(
            AssetRepository assetRepository,
            TransferRequestRepository transferRequestRepository,
            TransferApprovalRepository transferApprovalRepository,
            AssetLifecycleRepository assetLifecycleRepository
    ) {
        this.assetRepository = assetRepository;
        this.transferRequestRepository = transferRequestRepository;
        this.transferApprovalRepository = transferApprovalRepository;
        this.assetLifecycleRepository = assetLifecycleRepository;
    }

    /* ======================================================
       CRIAR SOLICITAÇÃO DE TRANSFERÊNCIA
       ====================================================== */

    @Transactional
    public TransferRequest requestTransfer(
            UUID assetId,
            UUID toUnitId,
            UUID toResponsibleUserId,
            UUID requestedBy
    ) {
        Asset asset = assetRepository.findById(assetId)
                .orElseThrow(() -> new IllegalStateException("Ativo não encontrado"));

        if (asset.getStatus() != AssetStatus.EM_USO) {
            throw new IllegalStateException("Ativo não está disponível para transferência");
        }

        boolean alreadyPending =
                transferRequestRepository.existsByAssetIdAndStatus(assetId, TransferStatus.PENDENTE);

        if (alreadyPending) {
            throw new IllegalStateException("Já existe uma transferência pendente para este ativo");
        }

        asset.startTransfer();
        assetRepository.save(asset);

        TransferRequest request = TransferRequest.create(
                asset.getId(),
                asset.getUnitId(),
                toUnitId,
                asset.getResponsibleUserId(),
                toResponsibleUserId,
                requestedBy
        );

        transferRequestRepository.save(request);

        AssetLifecycleEvent event = AssetLifecycleEvent.ofStatusChange(
                asset.getId(),
                AssetStatus.EM_USO,
                AssetStatus.EM_TRANSFERENCIA,
                "TRANSFER_REQUESTED",
                requestedBy,
                null
        );

        assetLifecycleRepository.save(event);

        return request;
    }

    /* ======================================================
       APROVAR TRANSFERÊNCIA
       ====================================================== */

    @Transactional
    public void approveTransfer(UUID transferRequestId, UUID approverId) {
        TransferRequest request = transferRequestRepository.findById(transferRequestId)
                .orElseThrow(() -> new IllegalStateException("Solicitação de transferência não encontrada"));

        if (transferApprovalRepository.existsByTransferRequestId(transferRequestId)) {
            throw new IllegalStateException("Essa transferência já foi decidida");
        }

        request.approve(approverId);
        transferRequestRepository.save(request);

        TransferApproval approval =
                TransferApproval.approve(request.getId(), approverId);

        transferApprovalRepository.save(approval);

        Asset asset = assetRepository.findById(request.getAssetId())
                .orElseThrow(() -> new IllegalStateException("Ativo não encontrado"));

        AssetStatus previousStatus = asset.getStatus();

        asset.approveTransfer(
                request.getToUnitId(),
                request.getToResponsibleUserId()
        );

        assetRepository.save(asset);

        AssetLifecycleEvent event = AssetLifecycleEvent.ofStatusChange(
                asset.getId(),
                previousStatus,
                AssetStatus.EM_USO,
                "TRANSFER_APPROVED",
                approverId,
                null
        );

        assetLifecycleRepository.save(event);
    }

    /* ======================================================
       REJEITAR TRANSFERÊNCIA
       ====================================================== */

    @Transactional
    public void rejectTransfer(UUID transferRequestId, UUID approverId, String reason) {
        TransferRequest request = transferRequestRepository.findById(transferRequestId)
                .orElseThrow(() -> new IllegalStateException("Solicitação de transferência não encontrada"));

        if (transferApprovalRepository.existsByTransferRequestId(transferRequestId)) {
            throw new IllegalStateException("Essa transferência já foi decidida");
        }

        request.reject(approverId, reason);
        transferRequestRepository.save(request);

        TransferApproval approval =
                TransferApproval.reject(request.getId(), approverId, reason);

        transferApprovalRepository.save(approval);

        Asset asset = assetRepository.findById(request.getAssetId())
                .orElseThrow(() -> new IllegalStateException("Ativo não encontrado"));

        AssetStatus previousStatus = asset.getStatus();

        asset.returnFromMaintenance(); // volta para EM_USO
        assetRepository.save(asset);

        AssetLifecycleEvent event = AssetLifecycleEvent.ofStatusChange(
                asset.getId(),
                previousStatus,
                AssetStatus.EM_USO,
                "TRANSFER_REJECTED",
                approverId,
                reason
        );

        assetLifecycleRepository.save(event);
    }
}
