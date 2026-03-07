package com.portfolio.assetmanagement.config;

import java.util.Optional;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Configuração de JPA Auditing.
 *
 * <p>Provê o usuário autenticado atual para os campos @CreatedBy
 * e @LastModifiedBy. @EnableMethodSecurity foi removido — está declarado apenas em SecurityConfig
 * (#29).
 */
@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorProvider")
public class AuditorConfig {

  @Bean
  public AuditorAware<String> auditorProvider() {

    return () ->
        Optional.ofNullable(SecurityContextHolder.getContext().getAuthentication())
            .filter(Authentication::isAuthenticated)
            .map(Authentication::getName);
  }
}
