package com.portfolio.assetmanagement.integration;

import com.portfolio.assetmanagement.bdd.client.ApiClient;
import com.portfolio.assetmanagement.bdd.support.TestDataHelper;
import com.portfolio.assetmanagement.domain.asset.entity.Asset;
import com.portfolio.assetmanagement.domain.asset.enums.AssetType;
import com.portfolio.assetmanagement.domain.organization.entity.Organization;
import com.portfolio.assetmanagement.domain.unit.entity.Unit;
import com.portfolio.assetmanagement.domain.user.entity.User;
import io.restassured.module.mockmvc.response.MockMvcResponse;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * Classe base para testes de integração da camada HTTP.
 *
 * <p>Utiliza MockMvc via RestAssuredMockMvc (WebEnvironment.MOCK) — sem porta HTTP real.
 * Os filtros de segurança JWT são executados normalmente neste modo.
 *
 * <p>O perfil "test" ativa application-test.yml que configura H2 em memória e
 * desabilita Flyway, permitindo que JPA crie o schema a partir das entidades.
 *
 * <p>Cada teste parte de um banco limpo via cleanDatabase() no @BeforeEach.
 *
 * <p>Dados comuns (org/unidade/usuários/ativos) são criados via TestDataHelper,
 * que escreve diretamente no repositório sem passar pelos services (que exigem JWT).
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@ActiveProfiles("test")
public abstract class BaseIntegrationTest {

  @Autowired protected ApiClient apiClient;
  @Autowired protected TestDataHelper testDataHelper;

  // Entidades criadas no setup de cada teste
  protected Organization organizacao;
  protected Unit unidade;
  protected User admin;
  protected User gestor;
  protected User operador;

  @BeforeEach
  void limparEConfigurarBanco() {
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
