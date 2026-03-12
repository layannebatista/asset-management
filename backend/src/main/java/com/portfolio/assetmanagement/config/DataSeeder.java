package com.portfolio.assetmanagement.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Inicializa os hashes de senha dos usuários de demonstração.
 *
 * <p>O Flyway insere os usuários demo com um placeholder no campo password_hash. Este componente
 * substitui o placeholder pelo hash BCrypt real gerado pelo PasswordEncoder configurado na
 * aplicação, garantindo que o login funcione independente do ambiente.
 *
 * <p>Credenciais de demonstração: - admin@empresa.com / Admin@123 - gestor@empresa.com / Gestor@123
 * - operador@empresa.com / Op@12345
 */
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
    seedUser("admin@empresa.com", "Admin@123");
    seedUser("gestor@empresa.com", "Gestor@123");
    seedUser("operador@empresa.com", "Op@12345");
  }

  private void seedUser(String email, String rawPassword) {
    try {
      String currentHash =
          jdbcTemplate.queryForObject(
              "SELECT password_hash FROM users WHERE email = ?", String.class, email);

      if (currentHash == null || currentHash.equals(SEED_PLACEHOLDER)) {
        String hash = passwordEncoder.encode(rawPassword);
        jdbcTemplate.update("UPDATE users SET password_hash = ? WHERE email = ?", hash, email);
        log.info("DataSeeder: hash atualizado para {}", email);
      }
    } catch (Exception e) {
      log.warn(
          "DataSeeder: usuário {} não encontrado ou erro ao atualizar hash: {}",
          email,
          e.getMessage());
    }
  }
}
