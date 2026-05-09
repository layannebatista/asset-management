package com.portfolio.assetmanagement.bdd.config;

import com.portfolio.assetmanagement.bdd.steps.auth.AuthStepsContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Scope;

/** Configuração de Beans para os Steps de Auth. */
@Configuration
public class AuthStepsConfiguration {

  @Bean
  @Scope("cucumber-glue")
  public AuthStepsContext authStepsContext() {
    return new AuthStepsContext();
  }
}
