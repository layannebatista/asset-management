package com.portfolio.assetmanagement.application.maintenance.service;

import com.portfolio.assetmanagement.application.maintenance.dto.MaintenanceBudgetDTO;
import com.portfolio.assetmanagement.domain.maintenance.entity.MaintenanceRecord;
import com.portfolio.assetmanagement.domain.maintenance.enums.MaintenanceStatus;
import com.portfolio.assetmanagement.infrastructure.persistence.maintenance.repository.MaintenanceRepository;
import com.portfolio.assetmanagement.security.context.LoggedUserContext;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MaintenanceQueryService {

  private final MaintenanceRepository repository;
  private final LoggedUserContext loggedUser;

  public MaintenanceQueryService(MaintenanceRepository repository, LoggedUserContext loggedUser) {
    this.repository = repository;
    this.loggedUser = loggedUser;
  }

  /**
   * Lista manutenções com filtros dinâmicos.
   * - ADMIN: organização inteira; aceita unitId e requestedByUserId como filtros extras
   * - GESTOR: sua unidade por padrão; pode filtrar por requestedByUserId dentro da unidade
   * - OPERADOR: apenas seus ativos (pelo assignedUser)
   */
  @Transactional(readOnly = true)
  public Page<MaintenanceRecord> list(
      MaintenanceStatus status,
      Long assetId,
      Long unitId,
      Long requestedByUserId,
      LocalDate startDate,
      LocalDate endDate,
      Pageable pageable) {

    Specification<MaintenanceRecord> spec = Specification.where(null);

    // Isolamento por organização (sempre)
    Long orgId = loggedUser.getOrganizationId();
    spec = spec.and((root, q, cb) -> cb.equal(root.get("organizationId"), orgId));

    // Isolamento por role
    if (loggedUser.isManager()) {
      Long scopeUnitId = unitId != null ? unitId : loggedUser.getUnitId();
      if (scopeUnitId != null) {
        final Long fUnitId = scopeUnitId;
        spec = spec.and((root, q, cb) -> cb.equal(root.get("unitId"), fUnitId));
      }
      // GESTOR pode filtrar por usuário solicitante dentro da sua unidade
      if (requestedByUserId != null) {
        spec = spec.and((root, q, cb) -> cb.equal(root.get("requestedByUserId"), requestedByUserId));
      }
    } else if (loggedUser.isOperator()) {
      Long userId = loggedUser.getUserId();
      spec = spec.and(
          (root, q, cb) -> cb.equal(root.join("asset").get("assignedUser").get("id"), userId));
    } else {
      // ADMIN — aplica filtros opcionais
      if (unitId != null) {
        spec = spec.and((root, q, cb) -> cb.equal(root.get("unitId"), unitId));
      }
      if (requestedByUserId != null) {
        spec = spec.and((root, q, cb) -> cb.equal(root.get("requestedByUserId"), requestedByUserId));
      }
    }

    if (status != null) {
      spec = spec.and((root, q, cb) -> cb.equal(root.get("status"), status));
    }
    if (assetId != null) {
      spec = spec.and((root, q, cb) -> cb.equal(root.get("asset").get("id"), assetId));
    }
    if (startDate != null) {
      OffsetDateTime start = startDate.atStartOfDay().atOffset(ZoneOffset.UTC);
      spec = spec.and((root, q, cb) -> cb.greaterThanOrEqualTo(root.get("createdAt"), start));
    }
    if (endDate != null) {
      OffsetDateTime end = endDate.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC);
      spec = spec.and((root, q, cb) -> cb.lessThan(root.get("createdAt"), end));
    }

    return repository.findAll(spec, pageable);
  }

  /** Sobrecarga retrocompatível sem requestedByUserId. */
  @Transactional(readOnly = true)
  public Page<MaintenanceRecord> list(
      MaintenanceStatus status, Long assetId, Long unitId,
      LocalDate startDate, LocalDate endDate, Pageable pageable) {
    return list(status, assetId, unitId, null, startDate, endDate, pageable);
  }

  @Transactional(readOnly = true)
  public MaintenanceBudgetDTO getBudgetReport(Long unitId, LocalDate startDate, LocalDate endDate) {
    Long orgId = loggedUser.getOrganizationId();

    OffsetDateTime start = startDate != null
        ? startDate.atStartOfDay().atOffset(ZoneOffset.UTC)
        : OffsetDateTime.now().minusMonths(1);
    OffsetDateTime end = endDate != null
        ? endDate.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC)
        : OffsetDateTime.now();

    List<MaintenanceRecord> records = unitId != null
        ? repository.findByOrganizationIdAndUnitIdAndCreatedAtBetween(orgId, unitId, start, end)
        : repository.findByOrganizationIdAndCreatedAtBetween(orgId, start, end);

    BigDecimal totalEstimated = records.stream()
        .filter(r -> r.getEstimatedCost() != null)
        .map(MaintenanceRecord::getEstimatedCost)
        .reduce(BigDecimal.ZERO, BigDecimal::add);

    BigDecimal totalActual = records.stream()
        .filter(r -> r.getActualCost() != null)
        .map(MaintenanceRecord::getActualCost)
        .reduce(BigDecimal.ZERO, BigDecimal::add);

    long totalRecords = records.size();
    long completed = records.stream().filter(r -> r.getStatus() == MaintenanceStatus.COMPLETED).count();

    MaintenanceBudgetDTO dto = new MaintenanceBudgetDTO();
    dto.setTotalEstimatedCost(totalEstimated);
    dto.setTotalActualCost(totalActual);
    dto.setVariance(totalActual.subtract(totalEstimated));
    dto.setTotalRecords(totalRecords);
    dto.setCompletedRecords(completed);
    dto.setPeriodStart(start.toLocalDate());
    dto.setPeriodEnd(end.toLocalDate());
    return dto;
  }
}
