package com.portfolio.assetmanagement.application.inventory.service;

import com.portfolio.assetmanagement.domain.inventory.entity.InventorySession;
import com.portfolio.assetmanagement.domain.inventory.enums.InventoryStatus;
import com.portfolio.assetmanagement.domain.unit.entity.Unit;
import com.portfolio.assetmanagement.infrastructure.persistence.inventory.repository.InventorySessionRepository;
import com.portfolio.assetmanagement.shared.exception.BusinessException;
import com.portfolio.assetmanagement.shared.exception.ForbiddenException;
import java.util.List;
import org.springframework.stereotype.Service;

/** Serviço responsável por validações enterprise do Inventory. */
@Service
public class InventoryValidationService {

  private final InventorySessionRepository repository;

  public InventoryValidationService(InventorySessionRepository repository) {

    this.repository = repository;
  }

  /** Garante que unit pertence à organization. */
  public void validateUnitOwnership(Unit unit, Long organizationId) {

    if (!unit.getOrganization().getId().equals(organizationId)) {

      throw new ForbiddenException("Unit não pertence à organization");
    }
  }

  /** Garante que sessão pertence à organization. */
  public void validateOwnership(InventorySession session, Long organizationId) {

    if (!session.getOrganization().getId().equals(organizationId)) {

      throw new ForbiddenException("Inventory session não pertence à organization");
    }
  }

  /** Garante que não existe sessão ativa na unit. */
  public void validateNoActiveSession(Long unitId) {

    boolean exists =
        repository.existsByUnit_IdAndStatusIn(
            unitId, List.of(InventoryStatus.OPEN, InventoryStatus.IN_PROGRESS));

    if (exists) {

      throw new BusinessException("Já existe sessão ativa para esta unit");
    }
  }

  /** Valida se pode iniciar. */
  public void validateCanStart(InventorySession session) {

    if (session.getStatus() != InventoryStatus.OPEN) {

      throw new BusinessException("Somente sessões OPEN podem ser iniciadas");
    }
  }

  /** Valida se pode fechar. */
  public void validateCanClose(InventorySession session) {

    if (session.getStatus() != InventoryStatus.IN_PROGRESS) {

      throw new BusinessException("Somente sessões IN_PROGRESS podem ser fechadas");
    }
  }

  /** Valida se pode cancelar. */
  public void validateCanCancel(InventorySession session) {

    if (session.getStatus() == InventoryStatus.CLOSED) {

      throw new BusinessException("Sessão fechada não pode ser cancelada");
    }

    if (session.getStatus() == InventoryStatus.CANCELLED) {

      throw new BusinessException("Sessão já está cancelada");
    }
  }
}
