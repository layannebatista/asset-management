package com.portfolio.assetmanagement.application.audit.service;

import com.portfolio.assetmanagement.domain.audit.entity.AuditEvent;
import com.portfolio.assetmanagement.domain.audit.enums.AuditEventType;
import com.portfolio.assetmanagement.infrastructure.persistence.audit.repository.AuditEventRepository;
import com.portfolio.assetmanagement.security.context.LoggedUserContext;
import com.portfolio.assetmanagement.shared.exception.ValidationException;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Serviço responsável por consultas enterprise de auditoria.
 *
 * <p>Centraliza queries para:
 *
 * <p>- organização - unidade - usuário - target - tipo - período
 *
 * <p>Garante isolamento multi-tenant.
 */
@Service
public class AuditQueryService {

  private final AuditEventRepository repository;

  private final AuditIntegrityService integrityService;

  private final LoggedUserContext loggedUser;

  public AuditQueryService(
      AuditEventRepository repository,
      AuditIntegrityService integrityService,
      LoggedUserContext loggedUser) {

    this.repository = repository;
    this.integrityService = integrityService;
    this.loggedUser = loggedUser;
  }

  /** Lista eventos da organização atual. */
  @Transactional(readOnly = true)
  public List<AuditEvent> findCurrentOrganizationEvents() {

    Long organizationId = loggedUser.getOrganizationId();

    return repository.findByOrganizationIdOrderByCreatedAtDesc(organizationId);
  }

  /** Lista eventos por organização. */
  @Transactional(readOnly = true)
  public List<AuditEvent> findByOrganization(Long organizationId) {

    validateOrganizationAccess(organizationId);

    return repository.findByOrganizationIdOrderByCreatedAtDesc(organizationId);
  }

  /** Lista eventos por unidade. */
  @Transactional(readOnly = true)
  public List<AuditEvent> findByUnit(Long unitId) {

    return repository.findByUnitIdOrderByCreatedAtDesc(unitId);
  }

  /** Lista eventos por usuário. */
  @Transactional(readOnly = true)
  public List<AuditEvent> findByUser(Long userId) {

    return repository.findByActorUserIdOrderByCreatedAtDesc(userId);
  }

  /** Lista eventos por tipo. */
  @Transactional(readOnly = true)
  public List<AuditEvent> findByType(AuditEventType type) {

    if (type == null) {

      throw new ValidationException("AuditEventType é obrigatório");
    }

    return repository.findByTypeOrderByCreatedAtDesc(type);
  }

  /** Lista eventos por target. */
  @Transactional(readOnly = true)
  public List<AuditEvent> findByTarget(String targetType, Long targetId) {

    if (targetType == null || targetType.isBlank()) {

      throw new ValidationException("targetType é obrigatório");
    }

    if (targetId == null) {

      throw new ValidationException("targetId é obrigatório");
    }

    return repository.findByTargetTypeAndTargetIdOrderByCreatedAtDesc(targetType, targetId);
  }

  /** Lista eventos por período. */
  @Transactional(readOnly = true)
  public List<AuditEvent> findByPeriod(
      Long organizationId, OffsetDateTime start, OffsetDateTime end) {

    validateOrganizationAccess(organizationId);

    if (start == null || end == null) {

      throw new ValidationException("Período inválido");
    }

    if (end.isBefore(start)) {

      throw new ValidationException("Período inválido");
    }

    return repository.findByOrganizationIdAndCreatedAtBetweenOrderByCreatedAtDesc(
        organizationId, start, end);
  }

  /** Retorna último evento de target. */
  @Transactional(readOnly = true)
  public AuditEvent findLastEvent(String targetType, Long targetId) {

    return integrityService.getLastEvent(targetType, targetId);
  }

  /** Verifica existência de histórico. */
  @Transactional(readOnly = true)
  public boolean hasAuditHistory(String targetType, Long targetId) {

    return integrityService.hasAuditHistory(targetType, targetId);
  }

  /** Validação de acesso multi-tenant. */
  private void validateOrganizationAccess(Long organizationId) {

    if (organizationId == null) {

      throw new ValidationException("organizationId é obrigatório");
    }

    Long currentOrg = loggedUser.getOrganizationId();

    if (!currentOrg.equals(organizationId)) {

      throw new ValidationException("Acesso negado à organização");
    }
  }
}