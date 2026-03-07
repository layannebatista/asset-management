package com.portfolio.assetmanagement.security.context;

import com.portfolio.assetmanagement.domain.user.entity.User;
import com.portfolio.assetmanagement.infrastructure.persistence.user.repository.UserRepository;
import com.portfolio.assetmanagement.shared.exception.UnauthorizedException;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.annotation.RequestScope;

/**
 * Contexto centralizado do usuário autenticado.
 *
 * <p>Implementação segura e compatível com Spring Security padrão.
 *
 * <p>Spring guarda o email no SecurityContext. O User é resolvido via UserRepository.
 *
 * <p>Esta versão mantém compatibilidade total com todos os services existentes.
 *
 * <p>@RequestScope garante que o cache cachedUser seja isolado por request HTTP. Sem isso, o bean
 * seria singleton e o cachedUser vazaria entre usuários diferentes.
 */
@Component
@RequestScope
public class LoggedUserContext {

  private final UserRepository userRepository;

  /** Cache por request para evitar múltiplas queries no banco. */
  private User cachedUser;

  public LoggedUserContext(UserRepository userRepository) {
    this.userRepository = userRepository;
  }

  private Authentication authentication() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
      throw new UnauthorizedException("Usuário não autenticado");
    }
    return auth;
  }

  private String currentEmail() {
    return authentication().getName();
  }

  private User currentUser() {
    if (cachedUser != null) {
      return cachedUser;
    }
    cachedUser =
        userRepository
            .findByEmail(currentEmail())
            .orElseThrow(() -> new UnauthorizedException("Usuário autenticado não encontrado"));
    return cachedUser;
  }

  // =====================================================
  // Dados básicos
  // =====================================================

  public User getUser() {
    return currentUser();
  }

  public Long getUserId() {
    return currentUser().getId();
  }

  public Long getOrganizationId() {
    if (currentUser().getOrganization() == null) {
      throw new IllegalStateException("Usuário não possui organização");
    }
    return currentUser().getOrganization().getId();
  }

  public Long getUnitId() {
    if (currentUser().getUnit() == null) {
      return null;
    }
    return currentUser().getUnit().getId();
  }

  public String getEmail() {
    return currentUser().getEmail();
  }

  // =====================================================
  // Roles
  // =====================================================

  private boolean hasRole(String role) {
    return authentication().getAuthorities().stream().anyMatch(a -> a.getAuthority().equals(role));
  }

  public boolean isAdmin() {
    return hasRole("ROLE_ADMIN");
  }

  /**
   * Verifica se o usuário possui role GESTOR.
   *
   * <p>Corrigido: a authority gerada pelo UserDetailsServiceImpl é "ROLE_GESTOR" (baseada em
   * UserRole.GESTOR). A versão anterior verificava "ROLE_MANAGER", que nunca existia, fazendo este
   * método sempre retornar false — quebrando o fluxo do dashboard para gestores e o
   * AuthorizationService.requireManagerOrAdmin().
   */
  public boolean isManager() {
    return hasRole("ROLE_GESTOR");
  }

  public boolean isOperator() {
    return hasRole("ROLE_OPERADOR");
  }

  /** Verificação genérica de role. */
  public boolean hasAnyRole(String... roles) {
    for (String role : roles) {
      if (hasRole(role)) {
        return true;
      }
    }
    return false;
  }
}
