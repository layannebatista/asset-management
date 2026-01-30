package com.portfolio.asset_management.organization.service;

import com.portfolio.asset_management.organization.entity.Organization;
import com.portfolio.asset_management.organization.enums.OrganizationStatus;
import com.portfolio.asset_management.organization.repository.OrganizationRepository;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service responsável pelas regras de negócio relacionadas às organizações.
 *
 * <p>Centraliza a criação, consulta e alteração de status das empresas (tenants).
 */
@Service
public class OrganizationService {

  private final OrganizationRepository organizationRepository;

  public OrganizationService(OrganizationRepository organizationRepository) {
    this.organizationRepository = organizationRepository;
  }

  @Transactional
  public Organization createOrganization(String name) {
    validateOrganizationNameUniqueness(name);

    Organization organization = new Organization(name);
    return organizationRepository.save(organization);
  }

  public Organization findById(Long id) {
    return organizationRepository
        .findById(id)
        .orElseThrow(() -> new RuntimeException("Organização não encontrada"));
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
      throw new RuntimeException("Já existe uma organização com este nome");
    }
  }
}
