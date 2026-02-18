package com.portfolio.assetmanagement.application.organization.service;

import com.portfolio.assetmanagement.domain.organization.entity.Organization;
import com.portfolio.assetmanagement.domain.organization.enums.OrganizationStatus;
import com.portfolio.assetmanagement.infrastructure.persistence.organization.repository.OrganizationRepository;
import com.portfolio.assetmanagement.shared.exception.BusinessException;
import com.portfolio.assetmanagement.shared.exception.NotFoundException;
import java.util.Optional;
import org.springframework.stereotype.Service;

/**
 * Serviço responsável por validações centralizadas de Organization.
 *
 * <p>Evita duplicação de validações no OrganizationService e outros serviços.
 *
 * <p>Garante integridade e consistência enterprise.
 */
@Service
public class OrganizationValidationService {

  private final OrganizationRepository organizationRepository;

  public OrganizationValidationService(OrganizationRepository organizationRepository) {

    this.organizationRepository = organizationRepository;
  }

  /** Valida nome obrigatório e formato. */
  public void validateName(String name) {

    if (name == null || name.isBlank()) {

      throw new BusinessException("Nome da organização é obrigatório");
    }

    if (name.length() > 255) {

      throw new BusinessException("Nome da organização não pode exceder 255 caracteres");
    }
  }

  /** Garante unicidade do nome. */
  public void validateNameUniqueness(String name) {

    Optional<Organization> existing = organizationRepository.findByName(name);

    if (existing.isPresent()) {

      throw new BusinessException("Já existe uma organização com este nome");
    }
  }

  /** Busca organization ou falha. */
  public Organization requireExisting(Long organizationId) {

    if (organizationId == null) {

      throw new IllegalArgumentException("organizationId não pode ser null");
    }

    return organizationRepository
        .findById(organizationId)
        .orElseThrow(() -> new NotFoundException("Organização não encontrada"));
  }

  /** Garante que a organização esteja ativa. */
  public void requireActive(Organization organization) {

    if (organization == null) {

      throw new IllegalArgumentException("organization não pode ser null");
    }

    if (organization.getStatus() != OrganizationStatus.ACTIVE) {

      throw new BusinessException("Organização está inativa");
    }
  }

  /** Garante que a organização esteja inativa. */
  public void requireInactive(Organization organization) {

    if (organization == null) {

      throw new IllegalArgumentException("organization não pode ser null");
    }

    if (organization.getStatus() != OrganizationStatus.INACTIVE) {

      throw new BusinessException("Organização já está ativa");
    }
  }
}
