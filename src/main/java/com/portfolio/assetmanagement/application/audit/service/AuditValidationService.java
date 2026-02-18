package com.portfolio.assetmanagement.application.audit.service;

import com.portfolio.assetmanagement.domain.audit.entity.AuditEvent;
import com.portfolio.assetmanagement.domain.audit.enums.AuditEventType;
import com.portfolio.assetmanagement.shared.exception.ValidationException;
import java.time.OffsetDateTime;
import org.springframework.stereotype.Service;

/**
 * Serviço responsável pela validação de integridade de eventos de auditoria.
 *
 * <p>Garante:
 *
 * <p>- consistência de dados - integridade multi-tenant - proteção contra eventos inválidos -
 * compliance enterprise
 */
@Service
public class AuditValidationService {

  /** Valida criação de evento. */
  public void validateCreate(
      AuditEventType type,
      Long organizationId,
      Long actorUserId,
      String targetType,
      Long targetId,
      String details) {

    validateType(type);

    validateOrganization(organizationId);

    validateTarget(targetType, targetId);

    validateDetails(details);

    validateActor(actorUserId);
  }

  /** Valida evento existente. */
  public void validateExisting(AuditEvent event) {

    if (event == null) {

      throw new ValidationException("Evento de auditoria é obrigatório");
    }

    validateType(event.getType());

    validateOrganization(event.getOrganizationId());

    validateTimestamp(event.getCreatedAt());
  }

  /** Valida tipo. */
  private void validateType(AuditEventType type) {

    if (type == null) {

      throw new ValidationException("AuditEventType é obrigatório");
    }
  }

  /** Valida organizationId. */
  private void validateOrganization(Long organizationId) {

    if (organizationId == null) {

      throw new ValidationException("organizationId é obrigatório");
    }

    if (organizationId <= 0) {

      throw new ValidationException("organizationId inválido");
    }
  }

  /** Valida target. */
  private void validateTarget(String targetType, Long targetId) {

    if (targetType != null && targetType.length() > 100) {

      throw new ValidationException("targetType muito longo");
    }

    if (targetId != null && targetId <= 0) {

      throw new ValidationException("targetId inválido");
    }
  }

  /** Valida detalhes. */
  private void validateDetails(String details) {

    if (details == null) {
      return;
    }

    if (details.length() > 5000) {

      throw new ValidationException("details excede limite permitido");
    }
  }

  /** Valida actorUserId. */
  private void validateActor(Long actorUserId) {

    if (actorUserId == null) {
      return;
    }

    if (actorUserId <= 0) {

      throw new ValidationException("actorUserId inválido");
    }
  }

  /** Valida timestamp. */
  private void validateTimestamp(OffsetDateTime timestamp) {

    if (timestamp == null) {

      throw new ValidationException("createdAt é obrigatório");
    }

    if (timestamp.isAfter(OffsetDateTime.now().plusMinutes(1))) {

      throw new ValidationException("createdAt inválido (futuro)");
    }
  }
}