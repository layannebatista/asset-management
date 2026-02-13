package com.portfolio.asset_management.inventory.service;

import com.portfolio.asset_management.inventory.dto.InventoryResponseDTO;
import com.portfolio.asset_management.inventory.entity.InventorySession;
import com.portfolio.asset_management.inventory.repository.InventorySessionRepository;
import com.portfolio.asset_management.security.context.LoggedUserContext;
import com.portfolio.asset_management.shared.exception.NotFoundException;
import com.portfolio.asset_management.unit.entity.Unit;
import com.portfolio.asset_management.unit.service.UnitService;
import jakarta.transaction.Transactional;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

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

  /** Cria nova sessão de inventário. */
  @Transactional
  public InventoryResponseDTO create(Long unitId) {

    Unit unit = unitService.findById(unitId);

    validationService.validateUnitOwnership(unit, loggedUser.getOrganizationId());

    validationService.validateNoActiveSession(unit.getId());

    InventorySession session =
        new InventorySession(unit.getOrganization(), unit, loggedUser.getUser());

    InventorySession saved = repository.save(session);

    return map(saved);
  }

  /** Busca sessão por ID. */
  public InventoryResponseDTO findById(Long id) {

    InventorySession session =
        repository
            .findById(id)
            .orElseThrow(() -> new NotFoundException("Inventory session not found"));

    validationService.validateOwnership(session, loggedUser.getOrganizationId());

    return map(session);
  }

  /** Lista sessões da organization. */
  public List<InventoryResponseDTO> list() {

    return repository.findByOrganization_Id(loggedUser.getOrganizationId()).stream()
        .map(this::map)
        .collect(Collectors.toList());
  }

  /** Inicia sessão. */
  @Transactional
  public void start(Long id) {

    lockService.executeWithSessionLock(
        id,
        () -> {
          InventorySession session =
              repository
                  .findById(id)
                  .orElseThrow(() -> new NotFoundException("Inventory session not found"));

          validationService.validateOwnership(session, loggedUser.getOrganizationId());

          validationService.validateCanStart(session);

          session.start();

          return null;
        });
  }

  /** Fecha sessão. */
  @Transactional
  public void close(Long id) {

    lockService.executeWithSessionLock(
        id,
        () -> {
          InventorySession session =
              repository
                  .findById(id)
                  .orElseThrow(() -> new NotFoundException("Inventory session not found"));

          validationService.validateOwnership(session, loggedUser.getOrganizationId());

          validationService.validateCanClose(session);

          session.close();

          return null;
        });
  }

  /** Cancela sessão. */
  @Transactional
  public void cancel(Long id) {

    lockService.executeWithSessionLock(
        id,
        () -> {
          InventorySession session =
              repository
                  .findById(id)
                  .orElseThrow(() -> new NotFoundException("Inventory session not found"));

          validationService.validateOwnership(session, loggedUser.getOrganizationId());

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
