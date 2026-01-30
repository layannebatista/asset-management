package com.portfolio.asset_management.unit.service;

import com.portfolio.asset_management.organization.entity.Organization;
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

  public UnitService(UnitRepository unitRepository) {
    this.unitRepository = unitRepository;
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
              throw new RuntimeException("A organização já possui uma unidade principal");
            });

    Unit mainUnit = new Unit("Unidade Principal", organization, true);
    return unitRepository.save(mainUnit);
  }

  /** Cria uma nova unidade (filial) não principal. */
  @Transactional
  public Unit createUnit(String name, Organization organization) {
    Unit unit = new Unit(name, organization, false);
    return unitRepository.save(unit);
  }

  public List<Unit> findByOrganization(Organization organization) {
    return unitRepository.findByOrganization(organization);
  }

  public Unit findById(Long id) {
    return unitRepository
        .findById(id)
        .orElseThrow(() -> new RuntimeException("Unidade não encontrada"));
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
