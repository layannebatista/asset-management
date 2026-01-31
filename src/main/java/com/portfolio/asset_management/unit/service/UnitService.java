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

/**
 * Service responsável pelas regras de negócio relacionadas às unidades (filiais).
 *
 * <p>Garante a existência de uma única unidade principal por organização e centraliza operações de
 * criação, consulta e alteração de status.
 */
@Service
public class UnitService {

  private final UnitRepository unitRepository;
  private final AuditService auditService;

  public UnitService(UnitRepository unitRepository, AuditService auditService) {
    this.unitRepository = unitRepository;
    this.auditService = auditService;
  }

  /**
   * Cria automaticamente a unidade principal de uma organização.
   *
   * <p>Este método deve ser chamado no fluxo de criação da organização.
   */
  @Transactional
  public Unit createMainUnit(Organization organization) {
    unitRepository
        .findByOrganizationAndMainUnitTrue(organization)
        .ifPresent(
            existing -> {
              throw new BusinessException(
                  "A organização já possui uma unidade principal");
            });

    Unit mainUnit = new Unit("Unidade Principal", organization, true);
    Unit saved = unitRepository.save(mainUnit);

    // Auditoria – criação de unidade principal
    auditService.registerEvent(
        AuditEventType.UNIT_CREATED,
        null,                         // ação administrativa / sistema
        organization.getId(),         // organizationId
        saved.getId(),                // unitId
        saved.getId(),                // targetId
        "Main unit created");

    return saved;
  }

  /** Cria uma nova unidade (filial) não principal. */
  @Transactional
  public Unit createUnit(String name, Organization organization) {
    Unit unit = new Unit(name, organization, false);
    Unit saved = unitRepository.save(unit);

    // Auditoria – criação de unidade
    auditService.registerEvent(
        AuditEventType.UNIT_CREATED,
        null,                         // ação administrativa / sistema
        organization.getId(),         // organizationId
        saved.getId(),                // unitId
        saved.getId(),                // targetId
        "Unit created");

    return saved;
  }

  public List<Unit> findByOrganization(Organization organization) {
    return unitRepository.findByOrganization(organization);
  }

  public Unit findById(Long id) {
    return unitRepository
        .findById(id)
        .orElseThrow(() ->
            new NotFoundException("Unidade não encontrada"));
  }

  @Transactional
  public void inactivateUnit(Long id) {
    Unit unit = findById(id);
    unit.setStatus(UnitStatus.INACTIVE);
  }

  @Transactional
  public void activateUnit(Long id) {
    Unit unit = findById(id);
    unit.setStatus(UnitStatus.ACTIVE);
  }
}
