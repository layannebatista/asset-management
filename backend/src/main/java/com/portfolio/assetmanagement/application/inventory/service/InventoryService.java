package com.portfolio.assetmanagement.application.inventory.service;

import com.portfolio.assetmanagement.application.inventory.dto.InventoryResponseDTO;
import com.portfolio.assetmanagement.application.unit.service.UnitService;
import com.portfolio.assetmanagement.domain.inventory.entity.InventorySession;
import com.portfolio.assetmanagement.domain.unit.entity.Unit;
import com.portfolio.assetmanagement.infrastructure.persistence.inventory.repository.InventorySessionRepository;
import com.portfolio.assetmanagement.security.context.LoggedUserContext;
import com.portfolio.assetmanagement.shared.exception.ForbiddenException;
import com.portfolio.assetmanagement.shared.exception.NotFoundException;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InventoryService {

  private final InventorySessionRepository repository;
  private final UnitService unitService;
  private final LoggedUserContext loggedUser;
  private final InventoryValidationService validationService;
  private final InventoryLockService lockService;

  public InventoryService(
      InventorySessionRepository repository,
      UnitService unitService,
      LoggedUserContext loggedUser,
      InventoryValidationService validationService,
      InventoryLockService lockService) {

    this.repository = repository;
    this.unitService = unitService;
    this.loggedUser = loggedUser;
    this.validationService = validationService;
    this.lockService = lockService;
  }

  // 🔒 VALIDAÇÃO DE ACESSO
  private InventorySession validateAccess(Long id) {
    InventorySession session =
        repository
            .findById(id)
            .orElseThrow(() -> new NotFoundException("Inventory session not found"));

    if (loggedUser.isAdmin()) return session;

    if (loggedUser.isManager()) {
      if (session.getUnit() == null || !session.getUnit().getId().equals(loggedUser.getUnitId())) {
        throw new ForbiddenException("Acesso negado ao inventário");
      }
      return session;
    }

    throw new ForbiddenException("Operador não possui acesso ao inventário");
  }

  @Transactional
  public InventoryResponseDTO create(Long unitId) {

    Unit unit = unitService.findById(unitId);

    validationService.validateUnitOwnership(unit, loggedUser.getOrganizationId());
    validationService.validateNoActiveSession(unit.getId());

    if (loggedUser.isManager()) {
      if (loggedUser.getUnitId() == null || !loggedUser.getUnitId().equals(unit.getId())) {
        throw new ForbiddenException("Gestor só pode criar inventário na própria unidade");
      }
    }

    if (loggedUser.isOperator()) {
      throw new ForbiddenException("Operador não pode criar inventário");
    }

    InventorySession session =
        new InventorySession(unit.getOrganization(), unit, loggedUser.getUser());

    InventorySession saved = repository.save(session);

    return map(saved);
  }

  @Transactional(readOnly = true)
  public InventoryResponseDTO findById(Long id) {
    InventorySession session = validateAccess(id);
    validationService.validateOwnership(session, loggedUser.getOrganizationId());
    return map(session);
  }

  @Transactional(readOnly = true)
  public List<InventoryResponseDTO> list() {

    Long orgId = loggedUser.getOrganizationId();

    if (loggedUser.isAdmin()) {
      return repository.findByOrganization_Id(orgId).stream()
          .map(this::map)
          .collect(Collectors.toList());
    }

    if (loggedUser.isManager()) {
      Long unitId = loggedUser.getUnitId();

      return repository.findByOrganization_Id(orgId).stream()
          .filter(session -> session.getUnit() != null && session.getUnit().getId().equals(unitId))
          .map(this::map)
          .collect(Collectors.toList());
    }

    return List.of();
  }

  @Transactional
  public void start(Long id) {
    lockService.executeWithSessionLock(
        id,
        () -> {
          InventorySession session = validateAccess(id);
          validationService.validateCanStart(session);
          session.start();
          return null;
        });
  }

  @Transactional
  public void close(Long id) {
    lockService.executeWithSessionLock(
        id,
        () -> {
          InventorySession session = validateAccess(id);
          validationService.validateCanClose(session);
          session.close();
          return null;
        });
  }

  @Transactional
  public void cancel(Long id) {
    lockService.executeWithSessionLock(
        id,
        () -> {
          InventorySession session = validateAccess(id);
          validationService.validateCanCancel(session);
          session.cancel();
          return null;
        });
  }

  private InventoryResponseDTO map(InventorySession session) {
    return new InventoryResponseDTO(
        session.getId(),
        session.getUnit().getId(),
        session.getStatus(),
        session.getCreatedAt(),
        session.getClosedAt());
  }
}
