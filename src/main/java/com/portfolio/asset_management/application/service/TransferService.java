package com.portfolio.asset_management.application.service;

import com.portfolio.asset_management.domain.asset.Asset;
import com.portfolio.asset_management.domain.asset.AssetAction;
import com.portfolio.asset_management.domain.asset.AssetLifecycleEvent;
import com.portfolio.asset_management.domain.asset.AssetStatus;
import com.portfolio.asset_management.domain.transfer.TransferApproval;
import com.portfolio.asset_management.domain.transfer.TransferApprovalDecision;
import com.portfolio.asset_management.domain.transfer.TransferRequest;
import com.portfolio.asset_management.domain.transfer.TransferRequestStatus;
import com.portfolio.asset_management.infrastructure.persistence.AssetLifecycleRepository;
import com.portfolio.asset_management.infrastructure.persistence.AssetRepository;
import com.portfolio.asset_management.infrastructure.persistence.TransferApprovalRepository;
import com.portfolio.asset_management.infrastructure.persistence.TransferRequestRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Serviço de aplicação responsável por orquestrar
 * o processo de Transferência de Ativos.
 *
 * <p>Este service NÃO contém regra de negócio.
 * Ele coordena TransferRequest, TransferApproval e Asset.
 */
@Service
public class TransferService {

  private final TransferRequestRepository transferRequestRepository;
  private final TransferApprovalRepository transferApprovalRepository;
  private final AssetRepository assetRepository;
  private final AssetLifecycleRepository lifecycleRepository;

  public TransferService(
      TransferRequestRepository transferRequestRepository,
      TransferApprovalRepository transferApprovalRepository,
      AssetRepository assetRepository,
      AssetLifecycleRepository lifecycleRepository) {

    this.transferRequestRepository = transferRequestRepository;
    this.transferApprovalRepository = transferApprovalRepository;
    this.assetRepository = assetRepository;
    this.lifecycleRepository = lifecycleRepository;
  }

  /* ======================================================
     CRIAR TRANSFER REQUEST
     ====================================================== */

  @Transactional
  public TransferRequest criarTransferRequest(
      UUID assetId,
      UUID destinationUnitId,
      UUID requestedBy) {

    Asset asset = getAsset(assetId);

    transferRequestRepository
        .findAtivaByAssetId(assetId)
        .ifPresent(r -> {
          throw new IllegalStateException(
              "Já existe uma transferência ativa para este ativo");
        });

    TransferRequest request = TransferRequest.criar(
        assetId,
        asset.getUnitId(),
        destinationUnitId,
        requestedBy);

    TransferRequest savedRequest = transferRequestRepository.save(request);

    AssetStatus previousStatus = asset.getStatus();
    asset.solicitarTransferencia();
    assetRepository.save(asset);

    lifecycleRepository.save(
        AssetLifecycleEvent.create(
            assetId,
            previousStatus,
            asset.getStatus(),
            AssetAction.SOLICITAR_TRANSFERENCIA,
            savedRequest.getId(),
            requestedBy,
            "Transferência solicitada"));

    return savedRequest;
  }

  /* ======================================================
     SOLICITAR APROVAÇÃO
     ====================================================== */

  @Transactional
  public void solicitarAprovacao(UUID requestId) {
    TransferRequest request = getRequest(requestId);
    request.solicitarAprovacao();
    transferRequestRepository.save(request);
  }

  /* ======================================================
     APROVAR TRANSFERÊNCIA
     ====================================================== */

  @Transactional
  public TransferApproval aprovarTransferencia(
      UUID requestId,
      UUID approvedBy,
      String comment) {

    TransferRequest request = getRequest(requestId);
    request.aprovar();

    TransferApproval approval = TransferApproval.aprovar(
        requestId,
        approvedBy,
        comment);

    transferApprovalRepository.save(approval);
    transferRequestRepository.save(request);

    Asset asset = getAsset(request.getAssetId());
    AssetStatus previousStatus = asset.getStatus();

    asset.aprovarTransferencia();
    assetRepository.save(asset);

    lifecycleRepository.save(
        AssetLifecycleEvent.create(
            asset.getId(),
            previousStatus,
            asset.getStatus(),
            AssetAction.APROVAR_TRANSFERENCIA,
            requestId,
            approvedBy,
            "Transferência aprovada"));

    return approval;
  }

  /* ======================================================
     REJEITAR TRANSFERÊNCIA
     ====================================================== */

  @Transactional
  public TransferApproval rejeitarTransferencia(
      UUID requestId,
      UUID rejectedBy,
      String reason) {

    TransferRequest request = getRequest(requestId);
    request.rejeitar(reason);

    TransferApproval approval = TransferApproval.rejeitar(
        requestId,
        rejectedBy,
        reason);

    transferApprovalRepository.save(approval);
    transferRequestRepository.save(request);

    Asset asset = getAsset(request.getAssetId());
    AssetStatus previousStatus = asset.getStatus();

    asset.rejeitarTransferencia();
    assetRepository.save(asset);

    lifecycleRepository.save(
        AssetLifecycleEvent.create(
            asset.getId(),
            previousStatus,
            asset.getStatus(),
            AssetAction.REJEITAR_TRANSFERENCIA,
            requestId,
            rejectedBy,
            reason));

    return approval;
  }

  /* ======================================================
     EXECUTAR TRANSFERÊNCIA
     ====================================================== */

  @Transactional
  public void executarTransferencia(
      UUID requestId,
      UUID newResponsibleUserId) {

    TransferRequest request = getRequest(requestId);
    request.executar();

    transferRequestRepository.save(request);

    Asset asset = getAsset(request.getAssetId());
    AssetStatus previousStatus = asset.getStatus();

    asset.confirmarRecebimento(
        request.getDestinationUnitId(),
        newResponsibleUserId);

    assetRepository.save(asset);

    lifecycleRepository.save(
        AssetLifecycleEvent.create(
            asset.getId(),
            previousStatus,
            asset.getStatus(),
            AssetAction.CONFIRMAR_RECEBIMENTO,
            requestId,
            newResponsibleUserId,
            "Transferência executada"));
  }

  /* ======================================================
     CANCELAR TRANSFERÊNCIA
     ====================================================== */

  @Transactional
  public void cancelarTransferencia(
      UUID requestId,
      UUID cancelledBy,
      String reason) {

    TransferRequest request = getRequest(requestId);
    request.cancelar(reason);

    transferRequestRepository.save(request);

    Asset asset = getAsset(request.getAssetId());
    AssetStatus previousStatus = asset.getStatus();

    asset.rejeitarTransferencia();
    assetRepository.save(asset);

    lifecycleRepository.save(
        AssetLifecycleEvent.create(
            asset.getId(),
            previousStatus,
            asset.getStatus(),
            AssetAction.REJEITAR_TRANSFERENCIA,
            requestId,
            cancelledBy,
            reason));
  }

  /* ======================================================
     CONSULTAS
     ====================================================== */

  @Transactional(readOnly = true)
  public TransferRequest getTransferRequest(UUID requestId) {
    return getRequest(requestId);
  }

  @Transactional(readOnly = true)
  public List<TransferRequest> listarPorAsset(UUID assetId) {
    return transferRequestRepository.findAllByAssetId(assetId);
  }

  /* ======================================================
     APOIO
     ====================================================== */

  private TransferRequest getRequest(UUID requestId) {
    return transferRequestRepository.findById(requestId)
        .orElseThrow(() -> new IllegalStateException("TransferRequest não encontrada"));
  }

  private Asset getAsset(UUID assetId) {
    return assetRepository.findById(assetId)
        .orElseThrow(() -> new IllegalStateException("Ativo não encontrado"));
  }
}
