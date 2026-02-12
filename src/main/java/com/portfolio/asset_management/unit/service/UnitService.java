package com.portfolio.asset_management.unit.service;

import com.portfolio.asset_management.audit.enums.AuditEventType;
import com.portfolio.asset_management.audit.service.AuditService;
import com.portfolio.asset_management.organization.entity.Organization;
import com.portfolio.asset_management.shared.exception.BusinessException;
import com.portfolio.asset_management.shared.exception.NotFoundException;
import com.portfolio.asset_management.unit.entity.Unit;
import com.portfolio.asset_management.unit.enums.UnitStatus;
import com.portfolio.asset_management.unit.repository.UnitRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UnitService {

  private final UnitRepository unitRepository;
  private final AuditService auditService;

  public UnitService(UnitRepository unitRepository, AuditService auditService) {
    this.unitRepository = unitRepository;
    this.auditService = auditService;
  }

  @Transactional
  public Unit createMainUnit(Organization organization) {

    unitRepository
        .findByOrganizationAndMainUnitTrue(organization)
        .ifPresent(
            existing -> {
              throw new BusinessException("A organização já possui uma unidade principal");
            });

    Unit mainUnit = new Unit("Unidade Principal", organization, true);

    Unit saved = unitRepository.save(mainUnit);

    auditService.registerEvent(
        AuditEventType.UNIT_CREATED,
        null,
        organization.getId(),
        saved.getId(),
        saved.getId(),
        "Main unit created");

    return saved;
  }

  @Transactional
  public Unit createUnit(String name, Organization organization) {

    Unit unit = new Unit(name, organization, false);

    Unit saved = unitRepository.save(unit);

    auditService.registerEvent(
        AuditEventType.UNIT_CREATED,
        null,
        organization.getId(),
        saved.getId(),
        saved.getId(),
        "Unit created");

    return saved;
  }

  public List<Unit> findByOrganization(Organization organization) {

    return unitRepository.findByOrganization(organization);
  }

  public Unit findById(Long id) {

    return unitRepository
        .findById(id)
        .orElseThrow(() -> new NotFoundException("Unidade não encontrada"));
  }

  @Transactional
  public void inactivateUnit(Long id) {

    Unit unit = findById(id);

    if (unit.getStatus() == UnitStatus.INACTIVE) {
      throw new BusinessException("Unidade já está inativa");
    }

    unit.setStatus(UnitStatus.INACTIVE);

    auditService.registerEvent(
        AuditEventType.UNIT_STATUS_CHANGED,
        null,
        unit.getOrganization().getId(),
        unit.getId(),
        unit.getId(),
        "Unit inactivated");
  }

  @Transactional
  public void activateUnit(Long id) {

    Unit unit = findById(id);

    if (unit.getStatus() == UnitStatus.ACTIVE) {
      throw new BusinessException("Unidade já está ativa");
    }

    unit.setStatus(UnitStatus.ACTIVE);

    auditService.registerEvent(
        AuditEventType.UNIT_STATUS_CHANGED,
        null,
        unit.getOrganization().getId(),
        unit.getId(),
        unit.getId(),
        "Unit activated");
  }
}
