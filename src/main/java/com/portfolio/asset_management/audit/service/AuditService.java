package com.portfolio.asset_management.audit.service;

import com.portfolio.asset_management.audit.entity.AuditEvent;
import com.portfolio.asset_management.audit.enums.AuditEventType;
import com.portfolio.asset_management.audit.repository.AuditEventRepository;
import org.springframework.stereotype.Service;

/**
 * Serviço responsável por registrar eventos de auditoria.
 *
 * <p>Este serviço centraliza a criação de eventos auditáveis e deve ser utilizado por outros
 * módulos do sistema.
 */
@Service
public class AuditService {

  private final AuditEventRepository auditEventRepository;

  public AuditService(AuditEventRepository auditEventRepository) {
    this.auditEventRepository = auditEventRepository;
  }

  public void registerEvent(
      AuditEventType type,
      Long actorUserId,
      Long organizationId,
      Long unitId,
      Long targetId,
      String details) {

    AuditEvent event = new AuditEvent(type, actorUserId, organizationId, unitId, targetId, details);

    auditEventRepository.save(event);
  }
}
