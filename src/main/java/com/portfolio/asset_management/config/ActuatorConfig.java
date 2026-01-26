package com.portfolio.asset_management.config;

import org.springframework.boot.actuate.autoconfigure.endpoint.web.WebEndpointProperties;
import org.springframework.boot.actuate.autoconfigure.security.servlet.EndpointRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class ActuatorConfig {

  /** Segurança específica para endpoints do Actuator Health e Info públicos, demais protegidos */
  @Bean
  public SecurityFilterChain actuatorSecurityFilterChain(
      HttpSecurity http, WebEndpointProperties webEndpointProperties) throws Exception {

    String actuatorBasePath = webEndpointProperties.getBasePath();

    http.securityMatcher(actuatorBasePath + "/**")
        .authorizeHttpRequests(
            auth ->
                auth.requestMatchers(EndpointRequest.to("health", "info"))
                    .permitAll()
                    .anyRequest()
                    .hasRole("ADMIN"))
        .httpBasic(Customizer.withDefaults())
        .csrf(csrf -> csrf.disable());

    return http.build();
  }
}
