package com.portfolio.assetmanagement.security.service;

import com.portfolio.assetmanagement.domain.user.entity.User;
import com.portfolio.assetmanagement.infrastructure.persistence.user.repository.UserRepository;
import java.lang.reflect.Field;
import java.util.List;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

/**
 * Implementação segura do UserDetailsService.
 *
 * <p>Responsável por carregar o usuário autenticado pelo email.
 *
 * <p>Compatível com: - TokenService - JwtAuthenticationFilter - LoggedUserContext - SecurityConfig
 */
@Service
public class UserDetailsServiceImpl implements UserDetailsService {

  private final UserRepository userRepository;

  public UserDetailsServiceImpl(UserRepository userRepository) {
    this.userRepository = userRepository;
  }

  @Override
  public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {

    User user =
        userRepository
            .findByEmail(email)
            .orElseThrow(
                () -> new UsernameNotFoundException("Usuário não encontrado com email: " + email));

    return new org.springframework.security.core.userdetails.User(
        user.getEmail(),
        extractPasswordSafely(user),
        List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())));
  }

  /**
   * Extrai senha de forma segura.
   *
   * <p>Usa reflection apenas se necessário. Compatível com sua entidade atual.
   */
  private String extractPasswordSafely(User user) {

    // tentativa 1: getter padrão
    try {

      return (String) User.class.getMethod("getPasswordHash").invoke(user);

    } catch (Exception ignored) {
    }

    // fallback: reflection direta (compatibilidade com seu modelo atual)
    try {

      Field field = User.class.getDeclaredField("passwordHash");

      field.setAccessible(true);

      Object value = field.get(user);

      if (value == null) {

        throw new IllegalStateException("passwordHash está null para usuário: " + user.getEmail());
      }

      return value.toString();

    } catch (Exception ex) {

      throw new IllegalStateException("Erro ao acessar passwordHash da entidade User", ex);
    }
  }
}
