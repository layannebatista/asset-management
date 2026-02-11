package com.portfolio.asset_management.audit.controller;

import com.portfolio.asset_management.audit.entity.AuditEvent;
import com.portfolio.asset_management.audit.repository.AuditRepository;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/audit")
public class AuditController {

  private final AuditRepository auditRepository;

  public AuditController(AuditRepository auditRepository) {
    this.auditRepository = auditRepository;
  }

  @GetMapping("/organization/{organizationId}")
  public List<AuditEvent> findByOrganization(@PathVariable Long organizationId) {

    return auditRepository.findByOrganizationIdOrderByCreatedAtDesc(organizationId);
  }

  @GetMapping("/user/{userId}")
  public List<AuditEvent> findByUser(@PathVariable Long userId) {

    return auditRepository.findByUserIdOrderByCreatedAtDesc(userId);
  }

  @GetMapping("/target/{targetId}")
  public List<AuditEvent> findByTarget(@PathVariable Long targetId) {

    return auditRepository.findByTargetIdOrderByCreatedAtDesc(targetId);
  }

  @GetMapping("/all")
  public List<AuditEvent> findAll() {
    return auditRepository.findAll();
  }
}
