package com.portfolio.assetmanagement.application.maintenance.service;

import com.portfolio.assetmanagement.domain.asset.entity.Asset;
import com.portfolio.assetmanagement.domain.maintenance.entity.MaintenanceRecord;
import com.portfolio.assetmanagement.domain.maintenance.enums.MaintenanceStatus;
import com.portfolio.assetmanagement.infrastructure.persistence.asset.repository.AssetRepository;
import com.portfolio.assetmanagement.infrastructure.persistence.maintenance.repository.MaintenanceRepository;
import com.portfolio.assetmanagement.shared.exception.BusinessException;
import com.portfolio.assetmanagement.shared.exception.NotFoundException;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import jakarta.persistence.PersistenceContext;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Serviço responsável por controle de concorrência em Maintenance.
 *
 * <p>Protege contra:
 *
 * <p>- race conditions - double maintenance creation - corrupção de estado
 *
 * <p>Usa pessimistic locking direto na entidade Asset, garantindo que o lock seja sempre adquirido
 * independentemente de existirem manutenções anteriores.
 */
@Service
public class MaintenanceLockService {

  private final MaintenanceRepository repository;
  private final AssetRepository assetRepository;

  @PersistenceContext private EntityManager entityManager;

  public MaintenanceLockService(MaintenanceRepository repository, AssetRepository assetRepository) {

    this.repository = repository;
    this.assetRepository = assetRepository;
  }

  /**
   * Bloqueia o asset para criação de manutenção.
   *
   * <p>O lock é aplicado diretamente na entidade Asset via PESSIMISTIC_WRITE, garantindo proteção
   * mesmo na primeira manutenção do ativo — cenário onde a abordagem anterior (lock em
   * MaintenanceRecord) não funcionava (#10).
   */
  @Transactional
  public void lockAssetForMaintenance(Long assetId) {

    // Lock pessimista direto no Asset — sempre adquirido, independente
    // de existirem manutenções anteriores para este ativo
    Asset asset =
        assetRepository
            .findById(assetId)
            .orElseThrow(() -> new NotFoundException("Ativo não encontrado"));

    entityManager.lock(asset, LockModeType.PESSIMISTIC_WRITE);

    boolean exists =
        repository.existsByAssetIdAndStatusIn(
            assetId, List.of(MaintenanceStatus.REQUESTED, MaintenanceStatus.IN_PROGRESS));

    if (exists) {
      throw new BusinessException("Já existe manutenção ativa para este ativo");
    }
  }

  /** Bloqueia registro específico de manutenção. */
  @Transactional
  public void lockMaintenance(Long maintenanceId) {

    entityManager.find(MaintenanceRecord.class, maintenanceId, LockModeType.PESSIMISTIC_WRITE);
  }
}
