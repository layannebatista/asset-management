package com.portfolio.assetmanagement.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements ApplicationRunner {

  private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);
  private static final String SEED_PLACEHOLDER = "SEED_PENDING";

  private final JdbcTemplate jdbcTemplate;
  private final PasswordEncoder passwordEncoder;

  public DataSeeder(JdbcTemplate jdbcTemplate, PasswordEncoder passwordEncoder) {
    this.jdbcTemplate = jdbcTemplate;
    this.passwordEncoder = passwordEncoder;
  }

  @Override
  public void run(ApplicationArguments args) {
    log.info("DataSeeder >> iniciando verificação dos usuários demo...");
    seedUser("admin@empresa.com",    "Admin@123");
    seedUser("gestor@empresa.com",   "Gestor@123");
    seedUser("operador@empresa.com", "Op@12345");
    log.info("DataSeeder >> concluído.");
  }

  private void seedUser(String email, String rawPassword) {
    try {
      var rows = jdbcTemplate.queryForList(
          "SELECT id, password_hash, status, lgpd_accepted FROM users WHERE email = ?",
          email);

      if (rows.isEmpty()) {
        log.error("DataSeeder >> USUÁRIO NÃO ENCONTRADO: {} — Flyway pode não ter rodado.", email);
        return;
      }

      var row = rows.get(0);
      Long    id            = ((Number) row.get("id")).longValue();
      String  currentHash   = (String)  row.get("password_hash");
      String  currentStatus = (String)  row.get("status");
      boolean lgpdAccepted  = Boolean.TRUE.equals(row.get("lgpd_accepted"));

      log.info("DataSeeder >> [{}] id={} status={} lgpd={} hashPrefix={}",
          email, id, currentStatus, lgpdAccepted,
          currentHash != null ? currentHash.substring(0, Math.min(10, currentHash.length())) : "NULL");

      // 1. Corrige hash se inválido
      boolean hashInvalid = currentHash == null
          || currentHash.equals(SEED_PLACEHOLDER)
          || (!currentHash.startsWith("$2a$") && !currentHash.startsWith("$2b$"));

      if (hashInvalid) {
        String newHash = passwordEncoder.encode(rawPassword);
        jdbcTemplate.update("UPDATE users SET password_hash = ? WHERE id = ?", newHash, id);
        log.info("DataSeeder >> [{}] password_hash ATUALIZADO", email);
      } else {
        log.info("DataSeeder >> [{}] password_hash OK ({}...)", email, currentHash.substring(0, 10));
      }

      // 2. Garante status ACTIVE
      if (!"ACTIVE".equals(currentStatus)) {
        jdbcTemplate.update("UPDATE users SET status = 'ACTIVE' WHERE id = ?", id);
        log.info("DataSeeder >> [{}] status corrigido para ACTIVE (era: {})", email, currentStatus);
      }

      // 3. Garante lgpd_accepted = true
      if (!lgpdAccepted) {
        jdbcTemplate.update("UPDATE users SET lgpd_accepted = true WHERE id = ?", id);
        log.info("DataSeeder >> [{}] lgpd_accepted corrigido para true", email);
      }

    } catch (Exception e) {
      log.error("DataSeeder >> ERRO ao processar {}: {}", email, e.getMessage(), e);
    }
  }
}