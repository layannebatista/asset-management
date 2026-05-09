package com.portfolio.assetmanagement.bdd.config;

import com.portfolio.assetmanagement.bdd.steps.maintenance.MaintenanceStepsContext;
import com.portfolio.assetmanagement.bdd.steps.transfer.TransferStepsContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Scope;

/** Configuração de Beans para os Steps de Maintenance e Transfer. */
@Configuration
public class DomainStepsConfiguration {

  @Bean
  @Scope("cucumber-glue")
  public MaintenanceStepsContext maintenanceStepsContext() {
    return new MaintenanceStepsContext();
  }

  @Bean
  @Scope("cucumber-glue")
  public TransferStepsContext transferStepsContext() {
    return new TransferStepsContext();
  }
}
