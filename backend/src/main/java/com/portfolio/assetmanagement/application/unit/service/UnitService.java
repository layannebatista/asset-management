package com.portfolio.assetmanagement.application.unit.service;

import com.portfolio.assetmanagement.application.audit.service.AuditService;
import com.portfolio.assetmanagement.domain.audit.enums.AuditEventType;
import com.portfolio.assetmanagement.domain.organization.entity.Organization;
import com.portfolio.assetmanagement.domain.unit.entity.Unit;
import com.portfolio.assetmanagement.domain.unit.enums.UnitStatus;
import com.portfolio.assetmanagement.infrastructure.persistence.unit.repository.UnitRepository;
import com.portfolio.assetmanagement.shared.exception.BusinessException;
import com.portfolio.assetmanagement.shared.exception.NotFoundException;
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
    validateOrganization(organization);
    unitRepository
        .findByOrganizationAndMainUnitTrue(organization)
        .ifPresent(
            e -> {
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
    validateOrganization(organization);
    validateUnitName(name);
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

  // D2: adicionado @Transactional(readOnly = true) — Unit tem lazy relation com organization;
  // sem sessão ativa o acesso a organization em validações fora deste método lança
  // LazyInitializationException.
  @Transactional(readOnly = true)
  public List<Unit> findByOrganization(Organization organization) {
    validateOrganization(organization);
    return unitRepository.findByOrganization(organization);
  }

  // D2: mesmo motivo — findById é chamado por muitos outros services e controllers;
  // garantir sessão aberta evita erros em qualquer acesso lazy subsequente.
  @Transactional(readOnly = true)
  public Unit findById(Long id) {
    if (id == null) throw new IllegalArgumentException("unitId não pode ser null");
    return unitRepository
        .findById(id)
        .orElseThrow(() -> new NotFoundException("Unidade não encontrada"));
  }

  /**
   * B6: A versão anterior chamava unit.setStatus() sem unitRepository.save(), confiando em JPA
   * dirty checking — padrão inconsistente com OrganizationService que chama save() explicitamente.
   * Adicionado save() explícito.
   */
  @Transactional
  public void inactivateUnit(Long id) {
    Unit unit = findById(id);
    if (unit.getStatus() == UnitStatus.INACTIVE)
      throw new BusinessException("Unidade já está inativa");
    if (unit.isMainUnit())
      throw new BusinessException("Não é permitido inativar a unidade principal");
    unit.setStatus(UnitStatus.INACTIVE);
    unitRepository.save(unit); // B6
    auditService.registerEvent(
        AuditEventType.UNIT_INACTIVATED,
        null,
        unit.getOrganization().getId(),
        unit.getId(),
        unit.getId(),
        "Unit inactivated");
  }

  @Transactional
  public void activateUnit(Long id) {
    Unit unit = findById(id);
    if (unit.getStatus() == UnitStatus.ACTIVE) throw new BusinessException("Unidade já está ativa");
    unit.setStatus(UnitStatus.ACTIVE);
    unitRepository.save(unit); // B6
    auditService.registerEvent(
        AuditEventType.UNIT_ACTIVATED,
        null,
        unit.getOrganization().getId(),
        unit.getId(),
        unit.getId(),
        "Unit activated");
  }

  private void validateOrganization(Organization organization) {
    if (organization == null || organization.getId() == null)
      throw new IllegalArgumentException("organization é obrigatório");
  }

  private void validateUnitName(String name) {
    if (name == null || name.isBlank())
      throw new BusinessException("Nome da unidade é obrigatório");
    if (name.length() > 255)
      throw new BusinessException("Nome da unidade não pode exceder 255 caracteres");
  }
}
