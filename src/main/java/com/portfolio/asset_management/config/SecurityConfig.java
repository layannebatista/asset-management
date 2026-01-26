package com.portfolio.asset_management.config;

import com.portfolio.asset_management.security.config.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

  private final JwtAuthenticationFilter jwtAuthenticationFilter;

  public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
    this.jwtAuthenticationFilter = jwtAuthenticationFilter;
  }

  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

    http.csrf(csrf -> csrf.disable())
        .authorizeHttpRequests(
            auth ->
                auth

                    // públicos
                    .requestMatchers("/health", "/actuator/**")
                    .permitAll()

                    // INVENTÁRIO – somente gestor ou admin
                    .requestMatchers("/api/inventories/**")
                    .hasAnyRole("GESTOR", "ADMIN")

                    // MANUTENÇÃO – gestor ou admin
                    .requestMatchers("/api/maintenances/**")
                    .hasAnyRole("GESTOR", "ADMIN")

                    // TRANSFERÊNCIAS – gestor ou admin
                    .requestMatchers("/api/transfers/**")
                    .hasAnyRole("GESTOR", "ADMIN")

                    // ATIVOS – leitura para todos autenticados
                    .requestMatchers("/api/assets/**")
                    .hasAnyRole("USUARIO", "GESTOR", "ADMIN")
                    .anyRequest()
                    .authenticated())
        .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

    return http.build();
  }
}
