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

  @GetMapping
  public List<AuditEvent> getAllEvents() {
    return auditEventRepository.findAll();
  }

  @GetMapping("/{id}")
  public AuditEvent getEventById(@PathVariable Long id) {

    return auditEventRepository
        .findById(id)
        .orElseThrow(() -> new RuntimeException("AuditEvent não encontrado: " + id));
  }
}
