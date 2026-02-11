package com.portfolio.asset_management.audit.controller;

import com.portfolio.asset_management.audit.entity.AuditEvent;
import com.portfolio.asset_management.audit.repository.AuditEventRepository;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/audit")
public class AuditController {

  private final AuditEventRepository auditEventRepository;

  public AuditController(AuditEventRepository auditEventRepository) {
    this.auditEventRepository = auditEventRepository;
  }

  /** Retorna todos os eventos de auditoria */
  @GetMapping
  public List<AuditEvent> getAllEvents() {
    return auditEventRepository.findAll();
  }

  /** Retorna um evento específico por ID */
  @GetMapping("/{id}")
  public AuditEvent getEventById(@PathVariable Long id) {

    return auditEventRepository
        .findById(id)
        .orElseThrow(() -> new RuntimeException("Evento de auditoria não encontrado: " + id));
  }

  /** Retorna eventos por organização */
  @GetMapping("/organization/{organizationId}")
  public List<AuditEvent> getEventsByOrganization(@PathVariable Long organizationId) {

    return auditEventRepository.findByOrganizationId(organizationId);
  }

  /** Retorna eventos por organização e unidade */
  @GetMapping("/organization/{organizationId}/unit/{unitId}")
  public List<AuditEvent> getEventsByOrganizationAndUnit(
      @PathVariable Long organizationId, @PathVariable Long unitId) {

    return auditEventRepository.findByOrganizationIdAndUnitId(organizationId, unitId);
  }

  /** Retorna eventos por tipo */
  @GetMapping("/type/{type}")
  public List<AuditEvent> getEventsByType(@PathVariable String type) {

    return auditEventRepository.findByType(type);
  }
}
