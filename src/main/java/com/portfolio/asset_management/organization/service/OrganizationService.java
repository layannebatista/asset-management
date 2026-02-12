package com.portfolio.asset_management.organization.service;

import com.portfolio.asset_management.audit.enums.AuditEventType;
import com.portfolio.asset_management.audit.service.AuditService;
import com.portfolio.asset_management.organization.entity.Organization;
import com.portfolio.asset_management.organization.enums.OrganizationStatus;
import com.portfolio.asset_management.organization.repository.OrganizationRepository;
import com.portfolio.asset_management.shared.exception.BusinessException;
import com.portfolio.asset_management.shared.exception.NotFoundException;
import com.portfolio.asset_management.unit.service.UnitService;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrganizationService {

  private final OrganizationRepository organizationRepository;

  private final UnitService unitService;

  private final AuditService auditService;

  public OrganizationService(
      OrganizationRepository organizationRepository,
      UnitService unitService,
      AuditService auditService) {

    this.organizationRepository = organizationRepository;
    this.unitService = unitService;
    this.auditService = auditService;
  }

  @Transactional
  public Organization createOrganization(String name) {

    validateOrganizationNameUniqueness(name);

    Organization organization = new Organization(name);

    Organization saved = organizationRepository.save(organization);

    // ✅ CRIA UNIDADE PRINCIPAL AUTOMATICAMENTE
    unitService.createMainUnit(saved);

    // Auditoria
    auditService.registerEvent(
        AuditEventType.ORGANIZATION_CREATED,
        null,
        saved.getId(),
        null,
        saved.getId(),
        "Organization created with main unit");

    return saved;
  }

  public Organization findById(Long id) {

    return organizationRepository
        .findById(id)
        .orElseThrow(() -> new NotFoundException("Organização não encontrada"));
  }

  @Transactional
  public void inactivateOrganization(Long id) {

    Organization organization = findById(id);

    organization.setStatus(OrganizationStatus.INACTIVE);
  }

  @Transactional
  public void activateOrganization(Long id) {

    Organization organization = findById(id);

    organization.setStatus(OrganizationStatus.ACTIVE);
  }

  private void validateOrganizationNameUniqueness(String name) {

    Optional<Organization> existing = organizationRepository.findByName(name);

    if (existing.isPresent()) {

      throw new BusinessException("Já existe uma organização com este nome");
    }
  }
}
