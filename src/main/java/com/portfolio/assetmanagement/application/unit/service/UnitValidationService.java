package com.portfolio.assetmanagement.application.unit.service;

import com.portfolio.assetmanagement.domain.organization.entity.Organization;
import com.portfolio.assetmanagement.domain.unit.entity.Unit;
import com.portfolio.assetmanagement.domain.unit.enums.UnitStatus;
import com.portfolio.assetmanagement.infrastructure.persistence.unit.repository.UnitRepository;
import com.portfolio.assetmanagement.shared.exception.BusinessException;
import com.portfolio.assetmanagement.shared.exception.NotFoundException;
import java.util.Optional;
import org.springframework.stereotype.Service;

/**
 * Serviço responsável por validações centralizadas de Unit.
 *
 * <p>Evita duplicação de validações no UnitService e outros serviços.
 *
 * <p>Garante integridade e consistência enterprise.
 */
@Service
public class UnitValidationService {

  private final UnitRepository unitRepository;

  public UnitValidationService(UnitRepository unitRepository) {

    this.unitRepository = unitRepository;
  }

  /** Valida nome obrigatório. */
  public void validateName(String name) {

    if (name == null || name.isBlank()) {

      throw new BusinessException("Nome da unidade é obrigatório");
    }

    if (name.length() > 255) {

      throw new BusinessException("Nome da unidade não pode exceder 255 caracteres");
    }
  }

  /** Garante que a organização exista. */
  public void validateOrganization(Organization organization) {

    if (organization == null || organization.getId() == null) {

      throw new IllegalArgumentException("organization é obrigatório");
    }
  }

  /** Busca unidade existente. */
  public Unit requireExisting(Long unitId) {

    if (unitId == null) {

      throw new IllegalArgumentException("unitId não pode ser null");
    }

    return unitRepository
        .findById(unitId)
        .orElseThrow(() -> new NotFoundException("Unidade não encontrada"));
  }

  /** Garante que unidade esteja ativa. */
  public void requireActive(Unit unit) {

    if (unit.getStatus() != UnitStatus.ACTIVE) {

      throw new BusinessException("Unidade está inativa");
    }
  }

  /** Garante que unidade esteja inativa. */
  public void requireInactive(Unit unit) {

    if (unit.getStatus() != UnitStatus.INACTIVE) {

      throw new BusinessException("Unidade já está ativa");
    }
  }

  /** Garante que apenas uma unidade principal exista por organization. */
  public void validateMainUnitUniqueness(Organization organization) {

    Optional<Unit> existing = unitRepository.findByOrganizationAndMainUnitTrue(organization);

    if (existing.isPresent()) {

      throw new BusinessException("A organização já possui uma unidade principal");
    }
  }

  /** Garante que unidade pertence à organization correta. */
  public void validateOwnership(Unit unit, Organization organization) {

    if (!unit.getOrganization().getId().equals(organization.getId())) {

      throw new BusinessException("Unidade não pertence à organização informada");
    }
  }
}
