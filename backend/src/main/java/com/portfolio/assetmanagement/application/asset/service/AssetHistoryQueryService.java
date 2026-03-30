package com.portfolio.assetmanagement.application.asset.service;

import com.portfolio.assetmanagement.domain.asset.entity.Asset;
import com.portfolio.assetmanagement.domain.asset.entity.AssetAssignmentHistory;
import com.portfolio.assetmanagement.domain.asset.entity.AssetStatusHistory;
import com.portfolio.assetmanagement.infrastructure.persistence.asset.repository.AssetAssignmentHistoryRepository;
import com.portfolio.assetmanagement.infrastructure.persistence.asset.repository.AssetRepository;
import com.portfolio.assetmanagement.infrastructure.persistence.asset.repository.AssetStatusHistoryRepository;
import com.portfolio.assetmanagement.security.context.LoggedUserContext;
import com.portfolio.assetmanagement.shared.exception.BusinessException;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service de consulta ao histórico de ativos.
 *
 * <p>Criado para corrigir violação arquitetural: o AssetHistoryController injetava repositórios
 * diretamente, violando a regra de que controllers devem falar apenas com services.
 */
@Service
public class AssetHistoryQueryService {

  private final AssetStatusHistoryRepository statusRepository;
  private final AssetAssignmentHistoryRepository assignmentRepository;
  private final AssetRepository assetRepository;
  private final LoggedUserContext loggedUser;

  public AssetHistoryQueryService(
      AssetStatusHistoryRepository statusRepository,
      AssetAssignmentHistoryRepository assignmentRepository,
      AssetRepository assetRepository,
      LoggedUserContext loggedUser) {
    this.statusRepository = statusRepository;
    this.assignmentRepository = assignmentRepository;
    this.assetRepository = assetRepository;
    this.loggedUser = loggedUser;
  }

  @Transactional(readOnly = true)
  public List<AssetStatusHistory> findStatusHistory(Long assetId) {
    Asset asset = validateAccess(assetId);
    return statusRepository.findByAssetIdOrderByChangedAtDesc(asset.getId());
  }

  @Transactional(readOnly = true)
  public List<AssetAssignmentHistory> findAssignmentHistory(Long assetId) {
    Asset asset = validateAccess(assetId);
    return assignmentRepository.findByAssetIdOrderByChangedAtDesc(asset.getId());
  }

  // ─────────────────────────────────────────────
  // 🔒 VALIDAÇÃO DE ESCOPO (CORREÇÃO PRINCIPAL)
  // ─────────────────────────────────────────────
  private Asset validateAccess(Long assetId) {
    Asset asset =
        assetRepository
            .findById(assetId)
            .orElseThrow(() -> new BusinessException("Ativo não encontrado"));

    if (loggedUser.isAdmin()) {
      return asset;
    }

    if (loggedUser.isManager()) {
      if (asset.getUnit() == null ||
          !asset.getUnit().getId().equals(loggedUser.getUnitId())) {
        throw new BusinessException("Acesso negado ao ativo");
      }
      return asset;
    }

    // OPERADOR
    if (asset.getAssignedUser() == null ||
        !asset.getAssignedUser().getId().equals(loggedUser.getUserId())) {
      throw new BusinessException("Acesso negado ao ativo");
    }

    return asset;
  }
}