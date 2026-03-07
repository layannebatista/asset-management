package com.portfolio.assetmanagement.application.asset.service;

import com.portfolio.assetmanagement.domain.asset.entity.AssetAssignmentHistory;
import com.portfolio.assetmanagement.domain.asset.entity.AssetStatusHistory;
import com.portfolio.assetmanagement.infrastructure.persistence.asset.repository.AssetAssignmentHistoryRepository;
import com.portfolio.assetmanagement.infrastructure.persistence.asset.repository.AssetStatusHistoryRepository;
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

  public AssetHistoryQueryService(
      AssetStatusHistoryRepository statusRepository,
      AssetAssignmentHistoryRepository assignmentRepository) {
    this.statusRepository = statusRepository;
    this.assignmentRepository = assignmentRepository;
  }

  @Transactional(readOnly = true)
  public List<AssetStatusHistory> findStatusHistory(Long assetId) {
    return statusRepository.findByAssetIdOrderByChangedAtDesc(assetId);
  }

  @Transactional(readOnly = true)
  public List<AssetAssignmentHistory> findAssignmentHistory(Long assetId) {
    return assignmentRepository.findByAssetIdOrderByChangedAtDesc(assetId);
  }
}
