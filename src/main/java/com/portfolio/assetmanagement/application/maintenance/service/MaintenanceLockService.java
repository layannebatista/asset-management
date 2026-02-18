package com.portfolio.assetmanagement.application.maintenance.service;

import com.portfolio.assetmanagement.domain.maintenance.enums.MaintenanceStatus;
import com.portfolio.assetmanagement.infrastructure.persistence.maintenance.repository.MaintenanceRepository;
import com.portfolio.assetmanagement.shared.exception.BusinessException;
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
 * <p>Usa pessimistic locking no banco.
 */
@Service
public class MaintenanceLockService {

  private final MaintenanceRepository repository;

  @PersistenceContext private EntityManager entityManager;

  public MaintenanceLockService(MaintenanceRepository repository) {

    this.repository = repository;
  }

  /** Bloqueia o asset para criação de manutenção. */
  @Transactional
  public void lockAssetForMaintenance(Long assetId) {

    entityManager
        .createQuery("SELECT m.id FROM MaintenanceRecord m WHERE m.asset.id = :assetId")
        .setParameter("assetId", assetId)
        .setLockMode(LockModeType.PESSIMISTIC_WRITE)
        .getResultList();

    boolean exists =
        repository.existsByAssetIdAndStatusIn(
            assetId, List.of(MaintenanceStatus.REQUESTED, MaintenanceStatus.IN_PROGRESS));

    if (exists) {

      throw new BusinessException("Já existe manutenção ativa para este ativo");
    }
  }

  /** Bloqueia registro específico. */
  @Transactional
  public void lockMaintenance(Long maintenanceId) {

    entityManager.find(
        com.portfolio.assetmanagement.domain.maintenance.entity.MaintenanceRecord.class,
        maintenanceId,
        LockModeType.PESSIMISTIC_WRITE);
  }
}
