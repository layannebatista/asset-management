package com.portfolio.assetmanagement.config;

import com.portfolio.assetmanagement.security.filter.JwtAuthenticationFilter;
import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * Configuração principal de segurança.
 *
 * <p>Garante: - autenticação JWT stateless - proteção de todos endpoints privados - liberação
 * segura de endpoints públicos - compatibilidade com JwtAuthenticationFilter
 */
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

  private final JwtAuthenticationFilter jwtAuthenticationFilter;

  public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
    this.jwtAuthenticationFilter = jwtAuthenticationFilter;
  }

  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

    http
        // desabilita csrf pois usamos JWT
        .csrf(AbstractHttpConfigurer::disable)

        // habilita CORS
        .cors(cors -> cors.configurationSource(corsConfigurationSource()))

        // define sessão como stateless
        .sessionManagement(
            session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

        // define regras de autorização
        .authorizeHttpRequests(
            auth ->
                auth

                    // =========================
                    // 🔓 ENDPOINTS PÚBLICOS
                    // =========================
                    .requestMatchers("/auth/**")
                    .permitAll()
                    .requestMatchers("/actuator/**")
                    .permitAll()

                    // Swagger / OpenAPI
                    .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html")
                    .permitAll()

                    // =========================
                    // 🔐 RESTANTE PROTEGIDO
                    // =========================
                    .anyRequest()
                    .authenticated())

        // adiciona filtro JWT antes do filtro padrão
        .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

    return http.build();
  }

  /** Permite que Spring injete AuthenticationManager corretamente. */
  @Bean
  public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration)
      throws Exception {
    return configuration.getAuthenticationManager();
  }

  /** Configuração CORS compatível com frontend. */
  @Bean
  public CorsConfigurationSource corsConfigurationSource() {

    CorsConfiguration configuration = new CorsConfiguration();

    configuration.setAllowedOrigins(List.of("*"));
    configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
    configuration.setAllowedHeaders(List.of("*"));
    configuration.setAllowCredentials(false);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);

    return source;
  }
}
