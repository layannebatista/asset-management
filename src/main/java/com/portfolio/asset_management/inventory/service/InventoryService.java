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

  public InventoryService(
      InventorySessionRepository repository,
      UnitService unitService,
      LoggedUserContext loggedUser) {

    this.repository = repository;
    this.unitService = unitService;
    this.loggedUser = loggedUser;
  }

  @Transactional
  public InventoryResponseDTO create(Long unitId) {

    Unit unit = unitService.findById(unitId);

    if (!unit.getOrganization().getId().equals(loggedUser.getOrganizationId())) {
      throw new IllegalStateException("Cannot create inventory for another organization");
    }

    InventorySession session =
        new InventorySession(
            unit.getOrganization(),
            unit,
            loggedUser.getUser());

    InventorySession saved = repository.save(session);

    return map(saved);
  }

  public InventoryResponseDTO findById(Long id) {

    InventorySession session =
        repository.findById(id)
            .orElseThrow(() -> new NotFoundException("Inventory session not found"));

    if (!session.getOrganization().getId().equals(loggedUser.getOrganizationId())) {
      throw new IllegalStateException("Access denied");
    }

    return map(session);
  }

  public List<InventoryResponseDTO> list() {

    return repository.findByOrganization_Id(loggedUser.getOrganizationId())
        .stream()
        .map(this::map)
        .collect(Collectors.toList());
  }

  @Transactional
  public void start(Long id) {

    InventorySession session =
        repository.findById(id)
            .orElseThrow(() -> new NotFoundException("Inventory session not found"));

    validateOwnership(session);

    session.start();
  }

  @Transactional
  public void close(Long id) {

    InventorySession session =
        repository.findById(id)
            .orElseThrow(() -> new NotFoundException("Inventory session not found"));

    validateOwnership(session);

    session.close();
  }

  @Transactional
  public void cancel(Long id) {

    InventorySession session =
        repository.findById(id)
            .orElseThrow(() -> new NotFoundException("Inventory session not found"));

    validateOwnership(session);

    session.cancel();
  }

  private void validateOwnership(InventorySession session) {

    if (!session.getOrganization().getId().equals(loggedUser.getOrganizationId())) {
      throw new IllegalStateException("Access denied");
    }
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
