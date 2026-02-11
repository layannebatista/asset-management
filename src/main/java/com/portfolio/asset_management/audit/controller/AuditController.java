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

  /** Retorna todos os eventos de auditoria. */
  @GetMapping
  public List<AuditEvent> findAll() {
    return auditEventRepository.findAll();
  }

  /** Retorna um evento específico pelo ID. */
  @GetMapping("/{id}")
  public AuditEvent findById(@PathVariable Long id) {

    return auditEventRepository
        .findById(id)
        .orElseThrow(() -> new RuntimeException("Evento de auditoria não encontrado"));
  }
}
