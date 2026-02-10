package com.portfolio.asset_management.audit.controller;

import com.portfolio.asset_management.audit.dto.AuditEventResponseDTO;
import com.portfolio.asset_management.audit.entity.AuditEvent;
import com.portfolio.asset_management.audit.enums.AuditEventType;
import com.portfolio.asset_management.audit.service.AuditService;
import com.portfolio.asset_management.security.context.LoggedUserContext;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/audit")
public class AuditController {

  private final AuditService auditService;

  private final LoggedUserContext loggedUserContext;

  public AuditController(AuditService auditService, LoggedUserContext loggedUserContext) {

    this.auditService = auditService;
    this.loggedUserContext = loggedUserContext;
  }

  @GetMapping("/my-organization")
  public List<AuditEventResponseDTO> getMyOrganizationEvents() {

    Long organizationId = loggedUserContext.getOrganizationId();

    List<AuditEvent> events = auditService.findByOrganization(organizationId);

    return events.stream().map(AuditEventResponseDTO::new).collect(Collectors.toList());
  }

  @GetMapping("/user/{userId}")
  public List<AuditEventResponseDTO> getEventsByUser(@PathVariable Long userId) {

    List<AuditEvent> events = auditService.findByUser(userId);

    return events.stream().map(AuditEventResponseDTO::new).collect(Collectors.toList());
  }

  @GetMapping("/target")
  public List<AuditEventResponseDTO> getEventsByTarget(
      @RequestParam String targetType, @RequestParam Long targetId) {

    List<AuditEvent> events = auditService.findByTarget(targetType, targetId);

    return events.stream().map(AuditEventResponseDTO::new).collect(Collectors.toList());
  }

  @GetMapping("/type/{type}")
  public List<AuditEventResponseDTO> getEventsByType(@PathVariable AuditEventType type) {

    List<AuditEvent> events = auditService.findByType(type);

    return events.stream().map(AuditEventResponseDTO::new).collect(Collectors.toList());
  }
}
