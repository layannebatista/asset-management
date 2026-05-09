package com.portfolio.assetmanagement.bdd.support;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.ConnectionCallback;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class BddDatabaseCleaner {

  private final JdbcTemplate jdbcTemplate;
  private final String schema;

  public BddDatabaseCleaner(
      JdbcTemplate jdbcTemplate, @Value("${app.test-support.schema:public}") String schema) {
    this.jdbcTemplate = jdbcTemplate;
    this.schema = schema;
  }

  public void resetScenarioData() {
    String[] tables = {
      "audit_events",
      "asset_assignment_history",
      "asset_status_history",
      "asset_insurance",
      "transfer_requests",
      "maintenance_records",
      "inventory_items",
      "inventory_sessions",
      "refresh_tokens",
      "mfa_codes",
      "user_activation_tokens",
      "user_consents",
      "assets",
      "users",
      "units",
      "organizations"
    };

    String prefix = schema + ".";
    String databaseProduct =
        jdbcTemplate.execute(
            (ConnectionCallback<String>)
                connection -> connection.getMetaData().getDatabaseProductName().toLowerCase());

    if (databaseProduct != null && databaseProduct.contains("h2")) {
      jdbcTemplate.execute("SET REFERENTIAL_INTEGRITY FALSE");
      for (String table : tables) {
        jdbcTemplate.execute("TRUNCATE TABLE " + prefix + table);
      }
      jdbcTemplate.execute("SET REFERENTIAL_INTEGRITY TRUE");
      return;
    }

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
