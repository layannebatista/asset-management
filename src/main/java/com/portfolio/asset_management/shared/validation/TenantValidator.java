package com.portfolio.asset_management.shared.validation;

import com.portfolio.asset_management.shared.exception.ForbiddenException;

/**
 * Validador de isolamento multi-tenant.
 *
 * <p>Garante que entidades pertencem ao tenant correto.
 */
public final class TenantValidator {

  private TenantValidator() {}

  public static void requireSameOrganization(
      Long entityOrganizationId, Long contextOrganizationId) {

    if (entityOrganizationId == null || contextOrganizationId == null) {

      throw new ForbiddenException("Organização inválida");
    }

    if (!entityOrganizationId.equals(contextOrganizationId)) {

      throw new ForbiddenException("Acesso negado para esta organização");
    }
  }

  public static void requireSameUnit(Long entityUnitId, Long contextUnitId) {

    if (entityUnitId == null || contextUnitId == null) {

      throw new ForbiddenException("Unidade inválida");
    }

    if (!entityUnitId.equals(contextUnitId)) {

      throw new ForbiddenException("Acesso negado para esta unidade");
    }
  }

  public static void requireOwnership(Long ownerId, Long contextUserId) {

    if (ownerId == null || contextUserId == null) {

      throw new ForbiddenException("Usuário inválido");
    }

    if (!ownerId.equals(contextUserId)) {

      throw new ForbiddenException("Você não possui acesso a este recurso");
    }
  }
}
