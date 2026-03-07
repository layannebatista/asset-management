package com.portfolio.assetmanagement.application.audit.service;

import com.portfolio.assetmanagement.domain.audit.entity.AuditEvent;
import com.portfolio.assetmanagement.domain.audit.enums.AuditEventType;
import com.portfolio.assetmanagement.infrastructure.persistence.audit.repository.AuditEventRepository;
import com.portfolio.assetmanagement.security.context.LoggedUserContext;
import com.portfolio.assetmanagement.shared.exception.ForbiddenException;
import com.portfolio.assetmanagement.shared.exception.ValidationException;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

  @Transactional(readOnly = true)
  public List<AuditEvent> findCurrentOrganizationEvents() {
    return repository.findByOrganizationIdOrderByCreatedAtDesc(loggedUser.getOrganizationId());
  }

  @Transactional(readOnly = true)
  public List<AuditEvent> findByOrganization(Long organizationId) {
    validateOrganizationAccess(organizationId);
    return repository.findByOrganizationIdOrderByCreatedAtDesc(organizationId);
  }

  @Transactional(readOnly = true)
  public List<AuditEvent> findByUnit(Long unitId) {
    return repository.findByUnitIdOrderByCreatedAtDesc(unitId);
  }

  @Transactional(readOnly = true)
  public List<AuditEvent> findByUser(Long userId) {
    return repository.findByActorUserIdOrderByCreatedAtDesc(userId);
  }

  @Transactional(readOnly = true)
  public List<AuditEvent> findByType(AuditEventType type) {
    if (type == null) throw new ValidationException("AuditEventType é obrigatório");
    return repository.findByTypeOrderByCreatedAtDesc(type);
  }

  @Transactional(readOnly = true)
  public List<AuditEvent> findByTarget(String targetType, Long targetId) {
    if (targetType == null || targetType.isBlank())
      throw new ValidationException("targetType é obrigatório");
    if (targetId == null) throw new ValidationException("targetId é obrigatório");
    return repository.findByTargetTypeAndTargetIdOrderByCreatedAtDesc(targetType, targetId);
  }

  @Transactional(readOnly = true)
  public List<AuditEvent> findByPeriod(
      Long organizationId, OffsetDateTime start, OffsetDateTime end) {
    validateOrganizationAccess(organizationId);
    if (start == null || end == null) throw new ValidationException("Período inválido");
    if (end.isBefore(start)) throw new ValidationException("Período inválido");
    return repository.findByOrganizationIdAndCreatedAtBetweenOrderByCreatedAtDesc(
        organizationId, start, end);
  }

  @Transactional(readOnly = true)
  public AuditEvent findLastEvent(String targetType, Long targetId) {
    return integrityService.getLastEvent(targetType, targetId);
  }

  @Transactional(readOnly = true)
  public boolean hasAuditHistory(String targetType, Long targetId) {
    return integrityService.hasAuditHistory(targetType, targetId);
  }

  /** Exportação CSV — retorna eventos do período da organização do usuário logado. */
  @Transactional(readOnly = true)
  public List<AuditEvent> findForExport(LocalDate startDate, LocalDate endDate) {
    Long orgId = loggedUser.getOrganizationId();
    if (startDate == null && endDate == null) {
      return repository.findByOrganizationIdOrderByCreatedAtDesc(orgId);
    }
    OffsetDateTime start =
        startDate != null
            ? startDate.atStartOfDay().atOffset(ZoneOffset.UTC)
            : OffsetDateTime.now().minusMonths(1);
    OffsetDateTime end =
        endDate != null
            ? endDate.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC)
            : OffsetDateTime.now();
    return repository.findByOrganizationIdAndCreatedAtBetweenOrderByCreatedAtDesc(
        orgId, start, end);
  }

  private void validateOrganizationAccess(Long organizationId) {
    if (organizationId == null) throw new ValidationException("organizationId é obrigatório");
    if (loggedUser.isAdmin()) return;
    if (!loggedUser.getOrganizationId().equals(organizationId))
      throw new ForbiddenException("Acesso negado à organização");
  }
}
