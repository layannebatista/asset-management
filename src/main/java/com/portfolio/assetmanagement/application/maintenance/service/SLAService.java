package com.portfolio.assetmanagement.application.maintenance.service;

import com.portfolio.assetmanagement.domain.maintenance.entity.MaintenanceRecord;
import com.portfolio.assetmanagement.domain.maintenance.enums.MaintenanceStatus;
import com.portfolio.assetmanagement.infrastructure.persistence.maintenance.repository.MaintenanceRepository;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

/**
 * Serviço responsável pelo controle de SLA de manutenção.
 *
 * <p>Permite:
 *
 * <p>- detectar manutenções atrasadas - medir tempo médio de manutenção - detectar violações de SLA
 * - suportar automações futuras
 *
 * <p>Não altera estado — apenas monitora.
 */
@Service
public class SLAService {

  /**
   * SLA padrão: 72 horas.
   *
   * <p>Pode futuramente ser externalizado para config.
   */
  private static final Duration DEFAULT_SLA = Duration.ofHours(72);

  private final MaintenanceRepository repository;

  public SLAService(MaintenanceRepository repository) {

    this.repository = repository;
  }

  /** Retorna manutenções que violaram SLA. */
  public List<MaintenanceRecord> findSlaViolations() {

    OffsetDateTime now = OffsetDateTime.now();

    List<MaintenanceRecord> active =
        repository.findByStatusIn(
            List.of(MaintenanceStatus.REQUESTED, MaintenanceStatus.IN_PROGRESS));

    return active.stream()
        .filter(record -> Duration.between(record.getCreatedAt(), now).compareTo(DEFAULT_SLA) > 0)
        .collect(Collectors.toList());
  }

  /** Calcula duração de uma manutenção concluída. */
  public Duration calculateMaintenanceDuration(MaintenanceRecord record) {

    if (record == null) {

      throw new IllegalArgumentException("record é obrigatório");
    }

    if (record.getCompletedAt() == null) {

      return Duration.between(record.getCreatedAt(), OffsetDateTime.now());
    }

    return Duration.between(record.getCreatedAt(), record.getCompletedAt());
  }

  /** Verifica se manutenção violou SLA. */
  public boolean isSlaViolated(MaintenanceRecord record) {

    return calculateMaintenanceDuration(record).compareTo(DEFAULT_SLA) > 0;
  }

  /** Retorna duração média das manutenções concluídas. */
  public Duration calculateAverageResolutionTime(Long organizationId) {

    List<MaintenanceRecord> completed =
        repository.findByOrganizationIdOrderByCreatedAtDesc(organizationId).stream()
            .filter(r -> r.getStatus() == MaintenanceStatus.COMPLETED)
            .collect(Collectors.toList());

    if (completed.isEmpty()) {

      return Duration.ZERO;
    }

    Duration total =
        completed.stream()
            .map(this::calculateMaintenanceDuration)
            .reduce(Duration.ZERO, Duration::plus);

    return total.dividedBy(completed.size());
  }
}
