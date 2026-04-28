package com.portfolio.assetmanagement.config;

import com.portfolio.assetmanagement.config.ratelimit.RateLimitFilter;
import com.portfolio.assetmanagement.security.filter.JwtAuthenticationFilter;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
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
 * segura de endpoints públicos - resposta 401 padronizada via JwtAuthenticationEntryPoint
 */
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

  private final RateLimitFilter rateLimitFilter;
  private final JwtAuthenticationFilter jwtAuthenticationFilter;

  /**
   * Corrigido: JwtAuthenticationEntryPoint injetado e registrado no filtro de segurança.
   *
   * <p>Sem isso, requisições sem token recebiam a resposta padrão do Spring (redirect ou formato
   * inconsistente) em vez do JSON padronizado {"error": "Unauthorized"} definido na classe.
   */
  private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

  @Value("${app.cors.allowed-origins:http://localhost:5173}")
  private String allowedOrigins;

  public SecurityConfig(
      RateLimitFilter rateLimitFilter,
      JwtAuthenticationFilter jwtAuthenticationFilter,
      JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint) {

    this.rateLimitFilter = rateLimitFilter;
    this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    this.jwtAuthenticationEntryPoint = jwtAuthenticationEntryPoint;
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

        // entry point 401
        .exceptionHandling(ex -> ex.authenticationEntryPoint(jwtAuthenticationEntryPoint))

        // regras de autorização
        .authorizeHttpRequests(
            auth ->
                auth

                    // 🔥 LIBERA PREFLIGHT (CORS)
                    .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**")
                    .permitAll()

                    // =========================
                    // 🔓 ENDPOINTS PÚBLICOS
                    // =========================

                    // Login
                    .requestMatchers("/auth/**")
                    .permitAll()

                    // Ativação
                    .requestMatchers("/users/activation/activate")
                    .permitAll()

                    // Swagger
                    .requestMatchers(
                      "/v3/api-docs",
                      "/v3/api-docs/**",
                      "/v3/api-docs.yaml",
                      "/swagger-ui/**",
                      "/swagger-ui.html")
                    .permitAll()

                    // =========================
                    // 🔒 ACTUATOR
                    // =========================
                    .requestMatchers(
                        "/actuator/health", "/actuator/health/**", "/actuator/prometheus")
                    .permitAll()
                    .requestMatchers("/actuator/**")
                    .hasRole("ADMIN")

                    // =========================
                    // 🔐 RESTANTE
                    // =========================
                    .anyRequest()
                    .authenticated())

        // rate limit precisa executar antes dos filtros de autenticação
        .addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class)

        // filtro JWT
        .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

    return http.build();
  }

  /** Permite que Spring injete AuthenticationManager corretamente. */
  @Bean
  public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration)
      throws Exception {
    return configuration.getAuthenticationManager();
  }

  /**
   * Configuração CORS centralizada.
   *
   * <p>Origem permitida configurável via app.cors.allowed-origins no application.yml.
   */
  @Bean
  public CorsConfigurationSource corsConfigurationSource() {

    CorsConfiguration configuration = new CorsConfiguration();

    // garante que múltiplas origens funcionem corretamente
    configuration.setAllowedOriginPatterns(List.of(allowedOrigins.split(",")));

    configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));

    // Whitelisted headers apenas (não wildcard)
    configuration.setAllowedHeaders(
        List.of("Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"));

    // permite o frontend ler o Authorization (token JWT)
    configuration.setExposedHeaders(List.of("Authorization"));

    // necessário quando usa cookies/token/header auth
    configuration.setAllowCredentials(true);

    // 🔥 importante para cache do preflight (evita múltiplos OPTIONS)
    configuration.setMaxAge(3600L);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);

    return source;
  }
}
