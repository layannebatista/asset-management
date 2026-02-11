package com.portfolio.asset_management.security.service;

import com.portfolio.asset_management.user.entity.User;
import com.portfolio.asset_management.user.repository.UserRepository;
import java.lang.reflect.Field;
import java.util.List;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

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
            .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado"));

    return new org.springframework.security.core.userdetails.User(
        user.getEmail(),
        extractPassword(user),
        List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())));
  }

  private String extractPassword(User user) {

    try {

      Field field = User.class.getDeclaredField("passwordHash");

      field.setAccessible(true);

      return (String) field.get(user);

    } catch (Exception ex) {

      throw new RuntimeException("Erro ao acessar passwordHash", ex);
    }
  }
}
