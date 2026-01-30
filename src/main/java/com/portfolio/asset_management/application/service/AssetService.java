package com.portfolio.asset_management.application.service;

import com.portfolio.asset_management.domain.asset.Asset;
import com.portfolio.asset_management.domain.asset.AssetAction;
import com.portfolio.asset_management.domain.asset.AssetLifecycleEvent;
import com.portfolio.asset_management.domain.asset.AssetStatus;
import com.portfolio.asset_management.infrastructure.persistence.AssetLifecycleRepository;
import com.portfolio.asset_management.infrastructure.persistence.AssetRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Serviço de aplicação responsável por orquestrar os casos de uso do Asset.
 *
 * Regras de negócio e lifecycle ficam exclusivamente no domínio (Asset).
 * Este service apenas coordena persistência e eventos.
 */
@Service
public class AssetService {

  private final AssetRepository assetRepository;
  private final AssetLifecycleRepository lifecycleRepository;

  public AssetService(
      AssetRepository assetRepository,
      AssetLifecycleRepository lifecycleRepository) {
    this.assetRepository = assetRepository;
    this.lifecycleRepository = lifecycleRepository;
  }

  /* ======================================================
     CRIAÇÃO
     ====================================================== */

  @Transactional
  public Asset cadastrarAsset(String assetCode) {

    if (assetCode == null || assetCode.isBlank()) {
      throw new IllegalArgumentException("Código do ativo é obrigatório");
    }

    if (assetRepository.existsByAssetCode(assetCode)) {
      throw new IllegalStateException("Já existe um ativo com esse código");
    }

    Asset asset = new Asset(assetCode);
    Asset saved = assetRepository.save(asset);

    lifecycleRepository.save(
        AssetLifecycleEvent.create(
            saved.getId(),
            null,
            saved.getStatus(),
            AssetAction.ATIVAR,
            null,
            "Ativo cadastrado no sistema"));

    return saved;
  }

  /* ======================================================
     ATIVAÇÃO
     ====================================================== */

  @Transactional
  public Asset ativarAsset(
      UUID assetId,
      UUID unitId,
      UUID responsibleUserId,
      UUID triggeredBy) {

    Asset asset = getAssetById(assetId);
    AssetStatus previousStatus = asset.getStatus();

    asset.ativar(unitId, responsibleUserId);
    Asset saved = assetRepository.save(asset);

    lifecycleRepository.save(
        AssetLifecycleEvent.create(
            saved.getId(),
            previousStatus,
            saved.getStatus(),
            AssetAction.ATIVAR,
            triggeredBy,
            "Ativo ativado para uso"));

    return saved;
  }

  /* ======================================================
     TRANSFERÊNCIA
     ====================================================== */

  @Transactional
  public Asset solicitarTransferencia(UUID assetId, UUID triggeredBy) {

    Asset asset = getAssetById(assetId);
    AssetStatus previousStatus = asset.getStatus();

    asset.solicitarTransferencia();
    Asset saved = assetRepository.save(asset);

    lifecycleRepository.save(
        AssetLifecycleEvent.create(
            saved.getId(),
            previousStatus,
            saved.getStatus(),
            AssetAction.SOLICITAR_TRANSFERENCIA,
            triggeredBy,
            "Transferência solicitada"));

    return saved;
  }

  @Transactional
  public Asset aprovarTransferencia(UUID assetId, UUID triggeredBy) {

    Asset asset = getAssetById(assetId);
    AssetStatus previousStatus = asset.getStatus();

    asset.aprovarTransferencia();
    Asset saved = assetRepository.save(asset);

    lifecycleRepository.save(
        AssetLifecycleEvent.create(
            saved.getId(),
            previousStatus,
            saved.getStatus(),
            AssetAction.APROVAR_TRANSFERENCIA,
            triggeredBy,
            "Transferência aprovada"));

    return saved;
  }

  @Transactional
  public Asset rejeitarTransferencia(UUID assetId, UUID triggeredBy) {

    Asset asset = getAssetById(assetId);
    AssetStatus previousStatus = asset.getStatus();

    asset.rejeitarTransferencia();
    Asset saved = assetRepository.save(asset);

    lifecycleRepository.save(
        AssetLifecycleEvent.create(
            saved.getId(),
            previousStatus,
            saved.getStatus(),
            AssetAction.REJEITAR_TRANSFERENCIA,
            triggeredBy,
            "Transferência rejeitada"));

    return saved;
  }

  @Transactional
  public Asset confirmarRecebimento(
      UUID assetId,
      UUID newUnitId,
      UUID newResponsibleUserId,
      UUID triggeredBy) {

    Asset asset = getAssetById(assetId);
    AssetStatus previousStatus = asset.getStatus();

    asset.confirmarRecebimento(newUnitId, newResponsibleUserId);
    Asset saved = assetRepository.save(asset);

    lifecycleRepository.save(
        AssetLifecycleEvent.create(
            saved.getId(),
            previousStatus,
            saved.getStatus(),
            AssetAction.CONFIRMAR_RECEBIMENTO,
            triggeredBy,
            "Recebimento do ativo confirmado"));

    return saved;
  }

  /* ======================================================
     MANUTENÇÃO
     ====================================================== */

  @Transactional
  public Asset enviarParaManutencao(UUID assetId, UUID triggeredBy) {

    Asset asset = getAssetById(assetId);
    AssetStatus previousStatus = asset.getStatus();

    asset.enviarParaManutencao();
    Asset saved = assetRepository.save(asset);

    lifecycleRepository.save(
        AssetLifecycleEvent.create(
            saved.getId(),
            previousStatus,
            saved.getStatus(),
            AssetAction.ENVIAR_PARA_MANUTENCAO,
            triggeredBy,
            "Ativo enviado para manutenção"));

    return saved;
  }

  @Transactional
  public Asset retornarDaManutencao(UUID assetId, UUID triggeredBy) {

    Asset asset = getAssetById(assetId);
    AssetStatus previousStatus = asset.getStatus();

    asset.retornarDaManutencao();
    Asset saved = assetRepository.save(asset);

    lifecycleRepository.save(
        AssetLifecycleEvent.create(
            saved.getId(),
            previousStatus,
            saved.getStatus(),
            AssetAction.RETORNAR_DA_MANUTENCAO,
            triggeredBy,
            "Ativo retornou da manutenção"));

    return saved;
  }

  /* ======================================================
     INVENTÁRIO
     ====================================================== */

  @Transactional
  public Asset iniciarInventario(UUID assetId, UUID triggeredBy) {

    Asset asset = getAssetById(assetId);
    AssetStatus previousStatus = asset.getStatus();

    asset.iniciarInventario();
    Asset saved = assetRepository.save(asset);

    lifecycleRepository.save(
        AssetLifecycleEvent.create(
            saved.getId(),
            previousStatus,
            saved.getStatus(),
            AssetAction.INICIAR_INVENTARIO,
            triggeredBy,
            "Inventário iniciado"));

    return saved;
  }

  @Transactional
  public Asset confirmarLocalizado(UUID assetId, UUID triggeredBy) {

    Asset asset = getAssetById(assetId);
    AssetStatus previousStatus = asset.getStatus();

    asset.confirmarLocalizado();
    Asset saved = assetRepository.save(asset);

    lifecycleRepository.save(
        AssetLifecycleEvent.create(
            saved.getId(),
            previousStatus,
            saved.getStatus(),
            AssetAction.CONFIRMAR_LOCALIZADO,
            triggeredBy,
            "Ativo localizado no inventário"));

    return saved;
  }

  @Transactional
  public Asset marcarNaoLocalizado(UUID assetId, UUID triggeredBy) {

    Asset asset = getAssetById(assetId);
    AssetStatus previousStatus = asset.getStatus();

    asset.marcarNaoLocalizado();
    Asset saved = assetRepository.save(asset);

    lifecycleRepository.save(
        AssetLifecycleEvent.create(
            saved.getId(),
            previousStatus,
            saved.getStatus(),
            AssetAction.MARCAR_NAO_LOCALIZADO,
            triggeredBy,
            "Ativo não localizado no inventário"));

    return saved;
  }

  @Transactional
  public Asset localizarAtivo(UUID assetId, UUID triggeredBy) {

    Asset asset = getAssetById(assetId);
    AssetStatus previousStatus = asset.getStatus();

    asset.localizarAtivo();
    Asset saved = assetRepository.save(asset);

    lifecycleRepository.save(
        AssetLifecycleEvent.create(
            saved.getId(),
            previousStatus,
            saved.getStatus(),
            AssetAction.LOCALIZAR_ATIVO,
            triggeredBy,
            "Ativo localizado novamente"));

    return saved;
  }

  /* ======================================================
     BAIXA
     ====================================================== */

  @Transactional
  public Asset baixarAsset(
      UUID assetId,
      String reason,
      UUID triggeredBy) {

    Asset asset = getAssetById(assetId);
    AssetStatus previousStatus = asset.getStatus();

    asset.baixar(reason);
    Asset saved = assetRepository.save(asset);

    lifecycleRepository.save(
        AssetLifecycleEvent.create(
            saved.getId(),
            previousStatus,
            saved.getStatus(),
            AssetAction.BAIXAR,
            triggeredBy,
            reason));

    return saved;
  }

  /* ======================================================
     CONSULTAS
     ====================================================== */

  @Transactional(readOnly = true)
  public Asset getAssetById(UUID assetId) {
    return assetRepository
        .findById(assetId)
        .orElseThrow(() -> new IllegalStateException("Ativo não encontrado"));
  }

  @Transactional(readOnly = true)
  public List<Asset> listAssets(AssetStatus status) {
    if (status == null) {
      return assetRepository.findAll();
    }
    return assetRepository.findAllByStatus(status);
  }

  @Transactional(readOnly = true)
  public List<AssetLifecycleEvent> getLifecycleHistory(UUID assetId) {
    return lifecycleRepository.findAllByAssetIdOrderByOccurredAtAsc(assetId);
  }
}
