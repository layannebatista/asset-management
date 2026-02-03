package com.portfolio.asset_management.security.context;

import com.portfolio.asset_management.user.entity.User;
import com.portfolio.asset_management.user.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Contexto centralizado do usuário autenticado.
 *
 * <p>Implementação simples: - Spring guarda o email no SecurityContext - Buscamos o User no banco
 * pelo email
 *
 * <p>Sem principal custom. Sem enum. Sem reflection. Sem gambiarra.
 */
@Component
public class LoggedUserContext {

  private final UserRepository userRepository;

  public LoggedUserContext(UserRepository userRepository) {
    this.userRepository = userRepository;
  }

  private Authentication authentication() {
    return SecurityContextHolder.getContext().getAuthentication();
  }

  private String currentEmail() {

    Authentication auth = authentication();

    if (auth == null || !auth.isAuthenticated()) {
      throw new IllegalStateException("Usuário não autenticado");
    }

    return auth.getName(); // ← Spring guarda o username aqui
  }

  private User currentUser() {
    return userRepository
        .findByEmail(currentEmail())
        .orElseThrow(() -> new IllegalStateException("Usuário não encontrado"));
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
    return currentUser().getOrganization().getId();
  }

  public Long getUnitId() {
    return currentUser().getUnit().getId();
  }

  // =====================================================
  // Roles (Spring padrão)
  // =====================================================

  private boolean hasRole(String role) {
    return authentication().getAuthorities().stream().anyMatch(a -> a.getAuthority().equals(role));
  }

  public boolean isAdmin() {
    return hasRole("ROLE_ADMIN");
  }

  public boolean isManager() {
    return hasRole("ROLE_MANAGER");
  }

  public boolean isOperator() {
    return hasRole("ROLE_OPERATOR");
  }
}
