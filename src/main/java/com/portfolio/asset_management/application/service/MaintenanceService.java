package com.portfolio.asset_management.application.service;

import com.portfolio.asset_management.domain.asset.Asset;
import com.portfolio.asset_management.domain.asset.AssetAction;
import com.portfolio.asset_management.domain.asset.AssetLifecycleEvent;
import com.portfolio.asset_management.domain.asset.AssetStatus;
import com.portfolio.asset_management.domain.maintenance.MaintenanceRequest;
import com.portfolio.asset_management.infrastructure.persistence.AssetLifecycleRepository;
import com.portfolio.asset_management.infrastructure.persistence.AssetRepository;
import com.portfolio.asset_management.infrastructure.persistence.MaintenanceRequestRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Serviço de aplicação responsável por orquestrar o processo de Manutenção de Ativos.
 *
 * <p>Este service NÃO contém regra de negócio. Ele coordena MaintenanceRequest e Asset.
 */
@Service
public class MaintenanceService {

  private final MaintenanceRequestRepository maintenanceRequestRepository;
  private final AssetRepository assetRepository;
  private final AssetLifecycleRepository lifecycleRepository;

  public MaintenanceService(
      MaintenanceRequestRepository maintenanceRequestRepository,
      AssetRepository assetRepository,
      AssetLifecycleRepository lifecycleRepository) {

    this.maintenanceRequestRepository = maintenanceRequestRepository;
    this.assetRepository = assetRepository;
    this.lifecycleRepository = lifecycleRepository;
  }

  /* ======================================================
  CRIAR SOLICITAÇÃO DE MANUTENÇÃO
  ====================================================== */

  @Transactional
  public MaintenanceRequest criarSolicitacao(UUID assetId, UUID requestedBy) {

    Asset asset = getAsset(assetId);

    if (asset.getStatus() != AssetStatus.EM_USO) {
      throw new IllegalStateException("Apenas ativos em uso podem ser enviados para manutenção");
    }

    maintenanceRequestRepository
        .findAtivaByAssetId(assetId)
        .ifPresent(
            r -> {
              throw new IllegalStateException("Já existe uma manutenção ativa para este ativo");
            });

    MaintenanceRequest request = MaintenanceRequest.criar(assetId, requestedBy);

    MaintenanceRequest savedRequest = maintenanceRequestRepository.save(request);

    return savedRequest;
  }

  /* ======================================================
  INICIAR MANUTENÇÃO
  ====================================================== */

  @Transactional
  public void iniciarManutencao(UUID requestId, UUID triggeredBy) {

    MaintenanceRequest request = getRequest(requestId);
    request.iniciarManutencao();

    maintenanceRequestRepository.save(request);

    Asset asset = getAsset(request.getAssetId());
    AssetStatus previousStatus = asset.getStatus();

    asset.enviarParaManutencao();
    assetRepository.save(asset);

    lifecycleRepository.save(
        AssetLifecycleEvent.create(
            asset.getId(),
            previousStatus,
            asset.getStatus(),
            AssetAction.ENVIAR_PARA_MANUTENCAO,
            requestId,
            triggeredBy,
            "Ativo enviado para manutenção"));
  }

  /* ======================================================
  FINALIZAR MANUTENÇÃO
  ====================================================== */

  @Transactional
  public void finalizarManutencao(UUID requestId, UUID triggeredBy) {

    MaintenanceRequest request = getRequest(requestId);
    request.finalizarManutencao();

    maintenanceRequestRepository.save(request);

    Asset asset = getAsset(request.getAssetId());
    AssetStatus previousStatus = asset.getStatus();

    asset.retornarDaManutencao();
    assetRepository.save(asset);

    lifecycleRepository.save(
        AssetLifecycleEvent.create(
            asset.getId(),
            previousStatus,
            asset.getStatus(),
            AssetAction.RETORNAR_DA_MANUTENCAO,
            requestId,
            triggeredBy,
            "Manutenção finalizada"));
  }

  /* ======================================================
  CANCELAR MANUTENÇÃO
  ====================================================== */

  @Transactional
  public void cancelarManutencao(UUID requestId, UUID triggeredBy, String reason) {

    MaintenanceRequest request = getRequest(requestId);
    request.cancelar(reason);

    maintenanceRequestRepository.save(request);

    Asset asset = getAsset(request.getAssetId());
    AssetStatus previousStatus = asset.getStatus();

    asset.retornarDaManutencao();
    assetRepository.save(asset);

    lifecycleRepository.save(
        AssetLifecycleEvent.create(
            asset.getId(),
            previousStatus,
            asset.getStatus(),
            AssetAction.RETORNAR_DA_MANUTENCAO,
            requestId,
            triggeredBy,
            reason));
  }

  /* ======================================================
  CONSULTAS
  ====================================================== */

  @Transactional(readOnly = true)
  public MaintenanceRequest buscarPorId(UUID requestId) {
    return getRequest(requestId);
  }

  @Transactional(readOnly = true)
  public List<MaintenanceRequest> listarPorAsset(UUID assetId) {
    return maintenanceRequestRepository.findAllByAssetId(assetId);
  }

  /* ======================================================
  APOIO
  ====================================================== */

  private MaintenanceRequest getRequest(UUID requestId) {
    return maintenanceRequestRepository
        .findById(requestId)
        .orElseThrow(() -> new IllegalStateException("Solicitação de manutenção não encontrada"));
  }

  private Asset getAsset(UUID assetId) {
    return assetRepository
        .findById(assetId)
        .orElseThrow(() -> new IllegalStateException("Ativo não encontrado"));
  }
}
