package com.portfolio.assetmanagement.application.organization.service;

import com.portfolio.assetmanagement.application.audit.service.AuditService;
import com.portfolio.assetmanagement.application.unit.service.UnitService;
import com.portfolio.assetmanagement.domain.audit.enums.AuditEventType;
import com.portfolio.assetmanagement.domain.organization.entity.Organization;
import com.portfolio.assetmanagement.domain.organization.enums.OrganizationStatus;
import com.portfolio.assetmanagement.infrastructure.persistence.organization.repository.OrganizationRepository;
import com.portfolio.assetmanagement.shared.exception.BusinessException;
import com.portfolio.assetmanagement.shared.exception.NotFoundException;
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

  /** Cria uma nova organização com unidade principal automática. */
  @Transactional
  public Organization createOrganization(String name) {

    validateOrganizationName(name);

    validateOrganizationNameUniqueness(name);

    Organization organization = new Organization(name);

    Organization saved = organizationRepository.save(organization);

    // cria unidade principal automaticamente
    unitService.createMainUnit(saved);

    // auditoria
    auditService.registerEvent(
        AuditEventType.ORGANIZATION_CREATED,
        null,
        saved.getId(),
        null,
        saved.getId(),
        "Organization created with main unit");

    return saved;
  }

  /** Busca organização por ID. */
  public Organization findById(Long id) {

    if (id == null) {
      throw new IllegalArgumentException("organizationId não pode ser null");
    }

    return organizationRepository
        .findById(id)
        .orElseThrow(() -> new NotFoundException("Organização não encontrada"));
  }

  /** Inativa organização. */
  @Transactional
  public void inactivateOrganization(Long id) {

    Organization organization = findById(id);

    if (organization.getStatus() == OrganizationStatus.INACTIVE) {
      return;
    }

    organization.setStatus(OrganizationStatus.INACTIVE);

    auditService.registerEvent(
        AuditEventType.ORGANIZATION_INACTIVATED,
        null,
        organization.getId(),
        null,
        organization.getId(),
        "Organization inactivated");
  }

  /** Ativa organização. */
  @Transactional
  public void activateOrganization(Long id) {

    Organization organization = findById(id);

    if (organization.getStatus() == OrganizationStatus.ACTIVE) {
      return;
    }

    organization.setStatus(OrganizationStatus.ACTIVE);

    auditService.registerEvent(
        AuditEventType.ORGANIZATION_ACTIVATED,
        null,
        organization.getId(),
        null,
        organization.getId(),
        "Organization activated");
  }

  /** Valida nome obrigatório. */
  private void validateOrganizationName(String name) {

    if (name == null || name.isBlank()) {

      throw new BusinessException("Nome da organização é obrigatório");
    }

    if (name.length() > 255) {

      throw new BusinessException("Nome da organização não pode exceder 255 caracteres");
    }
  }

  /** Garante unicidade do nome. */
  private void validateOrganizationNameUniqueness(String name) {

    Optional<Organization> existing = organizationRepository.findByName(name);

    if (existing.isPresent()) {

      throw new BusinessException("Já existe uma organização com este nome");
    }
  }
}
