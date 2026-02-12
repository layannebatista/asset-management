package com.portfolio.asset_management.security.service;

import com.portfolio.asset_management.security.context.LoggedUserContext;
import com.portfolio.asset_management.shared.exception.ForbiddenException;
import org.springframework.stereotype.Service;

/**
 * Serviço centralizado de autorização.
 *
 * <p>Evita duplicação de validação nos services.
 */
@Service
public class AuthorizationService {

  private final LoggedUserContext loggedUser;

  public AuthorizationService(LoggedUserContext loggedUser) {
    this.loggedUser = loggedUser;
  }

  /** Verifica se o usuário pertence ao tenant. */
  public void requireOrganizationAccess(Long organizationId) {

    if (organizationId == null) {
      throw new IllegalArgumentException("organizationId não pode ser null");
    }

    if (loggedUser.isAdmin()) {
      return;
    }

    if (!organizationId.equals(loggedUser.getOrganizationId())) {

      throw new ForbiddenException("Acesso negado para organizationId=" + organizationId);
    }
  }

  /** Verifica se é admin. */
  public void requireAdmin() {

    if (!loggedUser.isAdmin()) {

      throw new ForbiddenException("Apenas administradores podem executar esta ação");
    }
  }

  /** Verifica se é manager ou admin. */
  public void requireManagerOrAdmin() {

    if (!(loggedUser.isAdmin() || loggedUser.isManager())) {

      throw new ForbiddenException("Apenas manager ou admin podem executar esta ação");
    }
  }
}
