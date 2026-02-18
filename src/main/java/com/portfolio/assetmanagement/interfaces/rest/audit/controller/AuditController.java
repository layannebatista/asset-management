package com.portfolio.assetmanagement.interfaces.rest.audit.controller;

import com.portfolio.assetmanagement.application.audit.service.AuditQueryService;
import com.portfolio.assetmanagement.domain.audit.entity.AuditEvent;
import com.portfolio.assetmanagement.domain.audit.enums.AuditEventType;
import com.portfolio.assetmanagement.shared.exception.NotFoundException;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Controller responsável por consultas de auditoria.
 *
 * <p>Enterprise-grade:
 *
 * <p>- Multi-tenant safe - Não acessa repository diretamente - Usa AuditQueryService
 */
@RestController
@RequestMapping("/audit")
public class AuditController {

  private final AuditQueryService queryService;

  public AuditController(AuditQueryService queryService) {

    this.queryService = queryService;
  }

  /** Lista eventos da organização atual. */
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @GetMapping
  public List<AuditEvent> listOrganizationEvents() {

    return queryService.findCurrentOrganizationEvents();
  }

  /** Lista eventos por usuário. */
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @GetMapping("/user/{userId}")
  public List<AuditEvent> listByUser(@PathVariable Long userId) {

    return queryService.findByUser(userId);
  }

  /** Lista eventos por tipo. */
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @GetMapping("/type/{type}")
  public List<AuditEvent> listByType(@PathVariable AuditEventType type) {

    return queryService.findByType(type);
  }

  /** Lista eventos por target. */
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @GetMapping("/target")
  public List<AuditEvent> listByTarget(
      @RequestParam String targetType, @RequestParam Long targetId) {

    return queryService.findByTarget(targetType, targetId);
  }

  /** Lista eventos por período. */
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @GetMapping("/period")
  public List<AuditEvent> listByPeriod(
      @RequestParam Long organizationId,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime start,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime end) {

    return queryService.findByPeriod(organizationId, start, end);
  }

  /** Último evento de um target. */
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @GetMapping("/target/last")
  public AuditEvent lastEvent(@RequestParam String targetType, @RequestParam Long targetId) {

    AuditEvent event = queryService.findLastEvent(targetType, targetId);

    if (event == null) {

      throw new NotFoundException("Nenhum evento encontrado");
    }

    return event;
  }
}
