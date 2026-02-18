package com.portfolio.assetmanagement.application.asset.service;

import com.portfolio.assetmanagement.domain.asset.entity.Asset;
import com.portfolio.assetmanagement.infrastructure.persistence.asset.repository.AssetRepository;
import com.portfolio.assetmanagement.domain.organization.entity.Organization;
import com.portfolio.assetmanagement.shared.exception.BusinessException;
import com.portfolio.assetmanagement.shared.exception.NotFoundException;
import com.portfolio.assetmanagement.domain.unit.entity.Unit;
import com.portfolio.assetmanagement.application.unit.service.UnitValidationService;
import com.portfolio.assetmanagement.domain.user.entity.User;
import org.springframework.stereotype.Service;

/**
 * Serviço responsável por validações centralizadas de Asset.
 *
 * <p>Garante integridade multi-tenant e consistência enterprise.
 */
@Service
public class AssetValidationService {

  private final AssetRepository assetRepository;

  private final UnitValidationService unitValidationService;

  public AssetValidationService(
      AssetRepository assetRepository, UnitValidationService unitValidationService) {

    this.assetRepository = assetRepository;
    this.unitValidationService = unitValidationService;
  }

  /** Valida assetTag obrigatório e formato. */
  public void validateAssetTag(String assetTag) {

    if (assetTag == null || assetTag.isBlank()) {

      throw new BusinessException("assetTag é obrigatório");
    }

    if (assetTag.length() > 100) {

      throw new BusinessException("assetTag inválido");
    }
  }

  /** Garante unicidade do assetTag. */
  public void validateAssetTagUniqueness(String assetTag) {

    if (assetRepository.existsByAssetTag(assetTag)) {

      throw new BusinessException("Já existe um ativo com este assetTag");
    }
  }

  /** Garante existência do asset. */
  public Asset requireExisting(Long assetId) {

    if (assetId == null) {

      throw new IllegalArgumentException("assetId não pode ser null");
    }

    return assetRepository
        .findById(assetId)
        .orElseThrow(() -> new NotFoundException("Ativo não encontrado"));
  }

  /** Garante integridade organization ↔ unit. */
  public void validateOrganizationUnitIntegrity(Organization organization, Unit unit) {

    if (organization == null || organization.getId() == null) {

      throw new IllegalArgumentException("organization é obrigatório");
    }

    if (unit == null || unit.getId() == null) {

      throw new IllegalArgumentException("unit é obrigatório");
    }

    unitValidationService.validateOwnership(unit, organization);
  }

  /** Garante integridade asset ↔ user. */
  public void validateAssignmentIntegrity(Asset asset, User user) {

    if (user == null) {

      throw new BusinessException("User é obrigatório");
    }

    if (!asset.getOrganization().getId().equals(user.getOrganization().getId())) {

      throw new BusinessException("Usuário não pertence à mesma organização do ativo");
    }
  }

  /** Garante que asset pertence à organization. */
  public void validateOwnership(Asset asset, Organization organization) {

    if (!asset.getOrganization().getId().equals(organization.getId())) {

      throw new BusinessException("Ativo não pertence à organização informada");
    }
  }
}