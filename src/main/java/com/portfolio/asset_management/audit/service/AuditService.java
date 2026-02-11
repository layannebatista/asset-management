package com.portfolio.asset_management.audit.service;

import com.portfolio.asset_management.audit.entity.AuditEvent;
import com.portfolio.asset_management.audit.enums.AuditEventType;
import com.portfolio.asset_management.audit.repository.AuditEventRepository;
import com.portfolio.asset_management.security.context.LoggedUserContext;
import java.time.OffsetDateTime;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditService {

  private static final Logger log = LoggerFactory.getLogger(AuditService.class);

  private final AuditEventRepository auditEventRepository;

  private final LoggedUserContext loggedUserContext;

  public AuditService(
      AuditEventRepository auditEventRepository, LoggedUserContext loggedUserContext) {

    this.auditEventRepository = auditEventRepository;
    this.loggedUserContext = loggedUserContext;
  }

  /**
   * MÉTODO LEGADO REAL DO SISTEMA Este é o método usado por OrganizationService, UnitService,
   * UserService e outros. NÃO alterar assinatura.
   */
  @Transactional
  public void registerEvent(
      AuditEventType eventType,
      Long actorUserId,
      Long organizationId,
      Long unitId,
      Long targetId,
      String details) {

    try {

      AuditEvent event =
          new AuditEvent(eventType, actorUserId, organizationId, unitId, targetId, details);

      auditEventRepository.save(event);

    } catch (Exception ex) {

      log.error(
          "Failed to persist audit event. EventType: {}, OrganizationId: {}, TargetId: {}",
          eventType,
          organizationId,
          targetId,
          ex);
    }
  }

  /** NOVO método enterprise (para uso futuro) */
  @Transactional
  public void logEvent(AuditEventType eventType, String targetType, Long targetId, String details) {

    try {

      Long actorUserId = null;
      Long organizationId = null;
      Long unitId = null;

      try {
        actorUserId = loggedUserContext.getUserId();
        organizationId = loggedUserContext.getOrganizationId();
        unitId = loggedUserContext.getUnitId();
      } catch (Exception ignored) {
      }

      AuditEvent event =
          new AuditEvent(
              eventType, actorUserId, organizationId, unitId, targetId, targetType, details);

      auditEventRepository.save(event);

    } catch (Exception ex) {

      log.error(
          "Failed to persist audit event. EventType: {}, TargetType: {}, TargetId: {}",
          eventType,
          targetType,
          targetId,
          ex);
    }
  }

  @Transactional(readOnly = true)
  public List<AuditEvent> findByOrganization(Long organizationId) {

    return auditEventRepository.findByOrganizationIdOrderByCreatedAtDesc(organizationId);
  }

  @Transactional(readOnly = true)
  public List<AuditEvent> findByUser(Long userId) {

    return auditEventRepository.findByActorUserIdOrderByCreatedAtDesc(userId);
  }

  @Transactional(readOnly = true)
  public List<AuditEvent> findByTarget(String targetType, Long targetId) {

    return auditEventRepository.findByTargetTypeAndTargetIdOrderByCreatedAtDesc(
        targetType, targetId);
  }

  @Transactional(readOnly = true)
  public List<AuditEvent> findByType(AuditEventType type) {

    return auditEventRepository.findByTypeOrderByCreatedAtDesc(type);
  }

  @Transactional(readOnly = true)
  public List<AuditEvent> findByOrganizationAndPeriod(
      Long organizationId, OffsetDateTime start, OffsetDateTime end) {

    return auditEventRepository.findByOrganizationIdAndCreatedAtBetweenOrderByCreatedAtDesc(
        organizationId, start, end);
  }
}
