package com.portfolio.assetmanagement.application.audit.service;

import com.portfolio.assetmanagement.domain.audit.entity.AuditEvent;
import com.portfolio.assetmanagement.domain.audit.enums.AuditEventType;
import com.portfolio.assetmanagement.infrastructure.persistence.audit.repository.AuditEventRepository;
import com.portfolio.assetmanagement.security.context.LoggedUserContext;
import java.time.OffsetDateTime;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Serviço responsável pela persistência e consulta de eventos de auditoria.
 *
 * <p>Garantias enterprise:
 *
 * <p>- nunca quebra fluxo principal - nunca lança exception para camada superior - garante
 * consistência mínima - suporta modo legado e enterprise
 */
@Service
public class AuditService {

  private static final Logger log = LoggerFactory.getLogger(AuditService.class);

  private final AuditEventRepository repository;

  private final LoggedUserContext loggedUser;

  public AuditService(AuditEventRepository repository, LoggedUserContext loggedUser) {

    this.repository = repository;
    this.loggedUser = loggedUser;
  }

  /**
   * MÉTODO LEGADO — NÃO ALTERAR ASSINATURA.
   *
   * <p>Usado por:
   *
   * <p>OrganizationService UnitService UserService AssetService MaintenanceService TransferService
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

      if (eventType == null) {

        log.warn("Audit ignored: eventType is null");

        return;
      }

      if (organizationId == null) {

        log.warn("Audit ignored: organizationId is null. EventType: {}", eventType);

        return;
      }

      AuditEvent event =
          new AuditEvent(
              eventType, actorUserId, organizationId, unitId, targetId, normalize(details));

      repository.save(event);

    } catch (Exception ex) {

      log.error(
          "Failed to persist audit event. Type={}, Org={}, Target={}",
          eventType,
          organizationId,
          targetId,
          ex);
    }
  }

  /** Método enterprise moderno. */
  @Transactional
  public void logEvent(AuditEventType eventType, String targetType, Long targetId, String details) {

    try {

      if (eventType == null) {

        log.warn("Audit ignored: eventType is null");

        return;
      }

      Long actorUserId = safeGetUserId();
      Long organizationId = safeGetOrganizationId();
      Long unitId = safeGetUnitId();

      if (organizationId == null) {

        log.warn("Audit ignored: organizationId unavailable. EventType={}", eventType);

        return;
      }

      AuditEvent event =
          new AuditEvent(
              eventType,
              actorUserId,
              organizationId,
              unitId,
              targetId,
              normalize(targetType),
              normalize(details));

      repository.save(event);

    } catch (Exception ex) {

      log.error(
          "Failed to persist enterprise audit event. Type={}, TargetType={}, TargetId={}",
          eventType,
          targetType,
          targetId,
          ex);
    }
  }

  /** Consultas */
  @Transactional(readOnly = true)
  public List<AuditEvent> findByOrganization(Long organizationId) {

    return repository.findByOrganizationIdOrderByCreatedAtDesc(organizationId);
  }

  @Transactional(readOnly = true)
  public List<AuditEvent> findByUser(Long userId) {

    return repository.findByActorUserIdOrderByCreatedAtDesc(userId);
  }

  @Transactional(readOnly = true)
  public List<AuditEvent> findByTarget(String targetType, Long targetId) {

    return repository.findByTargetTypeAndTargetIdOrderByCreatedAtDesc(targetType, targetId);
  }

  @Transactional(readOnly = true)
  public List<AuditEvent> findByType(AuditEventType type) {

    return repository.findByTypeOrderByCreatedAtDesc(type);
  }

  @Transactional(readOnly = true)
  public List<AuditEvent> findByOrganizationAndPeriod(
      Long organizationId, OffsetDateTime start, OffsetDateTime end) {

    return repository.findByOrganizationIdAndCreatedAtBetweenOrderByCreatedAtDesc(
        organizationId, start, end);
  }

  /** Métodos auxiliares seguros */
  private Long safeGetUserId() {

    try {
      return loggedUser.getUserId();
    } catch (Exception ignored) {
      return null;
    }
  }

  private Long safeGetOrganizationId() {

    try {
      return loggedUser.getOrganizationId();
    } catch (Exception ignored) {
      return null;
    }
  }

  private Long safeGetUnitId() {

    try {
      return loggedUser.getUnitId();
    } catch (Exception ignored) {
      return null;
    }
  }

  private String normalize(String value) {

    if (value == null) {
      return null;
    }

    String trimmed = value.trim();

    if (trimmed.isEmpty()) {
      return null;
    }

    if (trimmed.length() > 5000) {

      return trimmed.substring(0, 5000);
    }

    return trimmed;
  }
}
