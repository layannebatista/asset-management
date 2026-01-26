package com.portfolio.asset_management.config;

import java.time.Duration;
import java.util.Map;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GovernancaConfig {

  /** Configura políticas de retenção e compliance */
  @Bean
  public GovernancePolicy governancePolicy() {
    return GovernancePolicy.builder()
        .auditRetention(Duration.ofDays(3650)) // 10 anos
        .eventRetention(Duration.ofDays(1825)) // 5 anos
        .anonymizationAfter(Duration.ofDays(730)) // 2 anos
        .lgpdEnabled(true)
        .build();
  }

  /** Feature flags corporativas */
  @Bean
  public Map<String, Boolean> featureFlags() {
    return Map.of(
        "AUDIT_STRICT_MODE", true,
        "ABAC_ENABLED", true,
        "CHAOS_MODE", false,
        "BULK_OPERATIONS_ENABLED", true);
  }

  /** Classe interna simples para política de governança */
  public static class GovernancePolicy {

    private final Duration auditRetention;
    private final Duration eventRetention;
    private final Duration anonymizationAfter;
    private final boolean lgpdEnabled;

    private GovernancePolicy(Builder builder) {
      this.auditRetention = builder.auditRetention;
      this.eventRetention = builder.eventRetention;
      this.anonymizationAfter = builder.anonymizationAfter;
      this.lgpdEnabled = builder.lgpdEnabled;
    }

    public static Builder builder() {
      return new Builder();
    }

    public static class Builder {
      private Duration auditRetention;
      private Duration eventRetention;
      private Duration anonymizationAfter;
      private boolean lgpdEnabled;

      public Builder auditRetention(Duration auditRetention) {
        this.auditRetention = auditRetention;
        return this;
      }

      public Builder eventRetention(Duration eventRetention) {
        this.eventRetention = eventRetention;
        return this;
      }

      public Builder anonymizationAfter(Duration anonymizationAfter) {
        this.anonymizationAfter = anonymizationAfter;
        return this;
      }

      public Builder lgpdEnabled(boolean lgpdEnabled) {
        this.lgpdEnabled = lgpdEnabled;
        return this;
      }

      public GovernancePolicy build() {
        return new GovernancePolicy(this);
      }
    }
  }
}
