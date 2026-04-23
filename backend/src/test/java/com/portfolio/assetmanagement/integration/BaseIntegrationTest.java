package com.portfolio.assetmanagement.integration;

import com.portfolio.assetmanagement.bdd.client.ApiClient;
import com.portfolio.assetmanagement.bdd.support.TestDataHelper;
import com.portfolio.assetmanagement.config.ratelimit.RateLimitFilter;
import com.portfolio.assetmanagement.domain.asset.entity.Asset;
import com.portfolio.assetmanagement.domain.asset.enums.AssetType;
import com.portfolio.assetmanagement.domain.organization.entity.Organization;
import com.portfolio.assetmanagement.domain.unit.entity.Unit;
import com.portfolio.assetmanagement.domain.user.entity.User;
import io.restassured.module.mockmvc.response.MockMvcResponse;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Classe base para testes de integração da camada HTTP.
 *
 * <p>Utiliza MockMvc via RestAssuredMockMvc (WebEnvironment.MOCK) — sem porta HTTP real.
 * Os filtros de segurança JWT são executados normalmente neste modo.
 *
 * <p>O perfil "test" é complementado via DynamicPropertySource para usar PostgreSQL real com
 * Testcontainers e Flyway habilitado, aproximando o comportamento de produção.
 *
 * <p>Cada teste parte de um banco limpo via cleanDatabase() no @BeforeEach.
 *
 * <p>Dados comuns (org/unidade/usuários/ativos) são criados via TestDataHelper,
 * que escreve diretamente no repositório sem passar pelos services (que exigem JWT).
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@ActiveProfiles("test")
@Testcontainers
public abstract class BaseIntegrationTest {

  @Container
  static final PostgreSQLContainer<?> POSTGRES =
      new PostgreSQLContainer<>("postgres:16-alpine")
          .withDatabaseName("asset_management_test")
          .withUsername("test_user")
          .withPassword("test_password");

  @DynamicPropertySource
  static void registerDynamicProperties(DynamicPropertyRegistry registry) {
    registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
    registry.add("spring.datasource.username", POSTGRES::getUsername);
    registry.add("spring.datasource.password", POSTGRES::getPassword);
    registry.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");

    registry.add("spring.flyway.enabled", () -> true);
    registry.add("spring.jpa.hibernate.ddl-auto", () -> "validate");
  }

  @Autowired protected ApiClient apiClient;
  @Autowired protected TestDataHelper testDataHelper;
  @Autowired protected RateLimitFilter rateLimitFilter;

  // Entidades criadas no setup de cada teste
  protected Organization organizacao;
  protected Unit unidade;
  protected User admin;
  protected User gestor;
  protected User operador;

  @BeforeEach
  void limparEConfigurarBanco() {
    rateLimitFilter.clearAllBucketsForTests();
    testDataHelper.cleanDatabase();
    organizacao = testDataHelper.criarOrganizacao("Tech Corp");
    unidade = testDataHelper.criarUnidade("Sede", organizacao);
    admin = testDataHelper.criarAdmin("admin@test.com", "Senha@123", organizacao, unidade);
    gestor = testDataHelper.criarGestor("gestor@test.com", "Senha@123", organizacao, unidade);
    operador = testDataHelper.criarOperador("operador@test.com", "Senha@123", organizacao, unidade);
  }

  // =========================================================
  // Helpers de autenticação
  // =========================================================

  protected String loginComoAdmin() {
    return extrairToken(apiClient.login("admin@test.com", "Senha@123"));
  }

  protected String loginComoGestor() {
    return extrairToken(apiClient.login("gestor@test.com", "Senha@123"));
  }

  protected String loginComoOperador() {
    return extrairToken(apiClient.login("operador@test.com", "Senha@123"));
  }

  private String extrairToken(MockMvcResponse response) {
    String token = response.path("accessToken");
    if (token == null || token.isBlank()) {
      throw new AssertionError(
          "Login falhou ou token ausente. Status: "
              + response.statusCode()
              + " Body: "
              + response.getBody().asString());
    }
    return token;
  }

  // =========================================================
  // Helpers de criação de dados
  // =========================================================

  protected Asset criarAtivo(String assetTag) {
    return testDataHelper.criarAtivo(assetTag, AssetType.NOTEBOOK, organizacao, unidade);
  }

  protected Asset criarAtivo(String assetTag, AssetType tipo) {
    return testDataHelper.criarAtivo(assetTag, tipo, organizacao, unidade);
  }
}
