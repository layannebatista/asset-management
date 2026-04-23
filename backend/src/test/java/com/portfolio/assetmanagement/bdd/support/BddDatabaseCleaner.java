package com.portfolio.assetmanagement.bdd.support;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class BddDatabaseCleaner {

  private final JdbcTemplate jdbcTemplate;
  private final String schema;

  public BddDatabaseCleaner(
      JdbcTemplate jdbcTemplate,
      @Value("${app.test-support.schema:public}") String schema) {
    this.jdbcTemplate = jdbcTemplate;
    this.schema = schema;
  }

  public void resetScenarioData() {
    String prefix = schema + ".";
    jdbcTemplate.execute(
        "TRUNCATE TABLE "
            + prefix
            + "audit_events,"
            + prefix
            + "asset_assignment_history,"
            + prefix
            + "asset_status_history,"
            + prefix
            + "asset_insurance,"
            + prefix
            + "transfer_requests,"
            + prefix
            + "maintenance_records,"
            + prefix
            + "inventory_items,"
            + prefix
            + "inventory_sessions,"
            + prefix
            + "refresh_tokens,"
            + prefix
            + "mfa_codes,"
            + prefix
            + "user_activation_tokens,"
            + prefix
            + "user_consents,"
            + prefix
            + "assets,"
            + prefix
            + "users,"
            + prefix
            + "units,"
            + prefix
            + "organizations RESTART IDENTITY CASCADE");
  }
}
