package com.portfolio.assetmanagement.security.service;

import com.portfolio.assetmanagement.domain.user.entity.User;
import com.portfolio.assetmanagement.domain.user.enums.UserStatus;
import com.portfolio.assetmanagement.infrastructure.persistence.user.repository.UserRepository;
import java.util.List;
import org.springframework.security.authentication.DisabledException;
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

    if (user.getStatus() != UserStatus.ACTIVE) {
      throw new DisabledException("Usuário não está ativo. Status atual: " + user.getStatus());
    }

    // CORRIGIDO: usuário pode existir no banco com passwordHash null se ainda não completou
    // a ativação. Neste caso, bloqueamos o login com mensagem adequada.
    if (user.getPasswordHash() == null) {
      throw new DisabledException(
          "Usuário ainda não definiu sua senha. Conclua o processo de ativação.");
    }

    return new org.springframework.security.core.userdetails.User(
        user.getEmail(),
        user.getPasswordHash(),
        List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())));
  }
}
