package com.portfolio.assetmanagement.application.audit.service;

import com.portfolio.assetmanagement.domain.audit.entity.AuditEvent;
import com.portfolio.assetmanagement.domain.audit.enums.AuditEventType;
import com.portfolio.assetmanagement.infrastructure.persistence.audit.repository.AuditEventRepository;
import com.portfolio.assetmanagement.shared.exception.ValidationException;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Serviço responsável por garantir integridade da auditoria.
 *
 * <p>Detecta:
 *
 * <p>- eventos inválidos - timestamps inconsistentes - eventos órfãos - corrupção de dados
 *
 * <p>Pode ser usado em:
 *
 * <p>- validações críticas - diagnósticos - health checks - rotinas de integridade
 */
@Service
public class AuditIntegrityService {

  private final AuditEventRepository repository;

  private final AuditValidationService validationService;

  public AuditIntegrityService(
      AuditEventRepository repository, AuditValidationService validationService) {

    this.repository = repository;
    this.validationService = validationService;
  }

  /** Verifica integridade de um evento específico. */
  @Transactional(readOnly = true)
  public void verifyEventIntegrity(Long eventId) {

    AuditEvent event =
        repository
            .findById(eventId)
            .orElseThrow(() -> new ValidationException("AuditEvent não encontrado"));

    validationService.validateExisting(event);

    verifyTimestampIntegrity(event);

    verifyLogicalIntegrity(event);
  }

  /** Verifica integridade da organização. */
  @Transactional(readOnly = true)
  public void verifyOrganizationIntegrity(Long organizationId) {

    List<AuditEvent> events = repository.findByOrganizationIdOrderByCreatedAtDesc(organizationId);

    for (AuditEvent event : events) {

      validationService.validateExisting(event);

      verifyTimestampIntegrity(event);

      verifyLogicalIntegrity(event);
    }
  }

  /** Verifica integridade por target. */
  @Transactional(readOnly = true)
  public void verifyTargetIntegrity(String targetType, Long targetId) {

    List<AuditEvent> events =
        repository.findByTargetTypeAndTargetIdOrderByCreatedAtDesc(targetType, targetId);

    for (AuditEvent event : events) {

      validationService.validateExisting(event);

      verifyTimestampIntegrity(event);

      verifyLogicalIntegrity(event);
    }
  }

  /** Verifica se existe histórico de auditoria. */
  @Transactional(readOnly = true)
  public boolean hasAuditHistory(String targetType, Long targetId) {

    return repository.existsByTargetTypeAndTargetId(targetType, targetId);
  }

  /** Retorna último evento. */
  @Transactional(readOnly = true)
  public AuditEvent getLastEvent(String targetType, Long targetId) {

    return repository
        .findFirstByTargetTypeAndTargetIdOrderByCreatedAtDesc(targetType, targetId)
        .orElse(null);
  }

  /** Verifica integridade temporal. */
  private void verifyTimestampIntegrity(AuditEvent event) {

    OffsetDateTime createdAt = event.getCreatedAt();

    if (createdAt == null) {

      throw new ValidationException("AuditEvent sem createdAt");
    }

    if (createdAt.isAfter(OffsetDateTime.now().plusMinutes(1))) {

      throw new ValidationException("AuditEvent com timestamp futuro inválido");
    }
  }

  /** Verifica integridade lógica. */
  private void verifyLogicalIntegrity(AuditEvent event) {

    AuditEventType type = event.getType();

    if (type == null) {

      throw new ValidationException("AuditEvent sem tipo");
    }

    if (event.getOrganizationId() == null) {

      throw new ValidationException("AuditEvent sem organizationId");
    }
  }
}
