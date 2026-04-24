package com.portfolio.assetmanagement.integration.maintenance;

import static org.assertj.core.api.Assertions.assertThat;

import com.portfolio.assetmanagement.bdd.support.TestDataHelper;
import com.portfolio.assetmanagement.integration.BaseIntegrationTest;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import io.qameta.allure.Story;
import io.restassured.module.mockmvc.response.MockMvcResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

@Epic("Backend")
@Feature("Integração — Manutenção")
@DisplayName("Criação de Manutenção")
@Tag("testType=Integration")
@Tag("module=Maintenance")
class MaintenanceCreateIntegrationTest extends BaseIntegrationTest {

  @Autowired private TestDataHelper testDataHelper;

  @Test
  @Story("Criação de manutenção")
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("MI01 - ADMIN cria manutenção com dados válidos — retorna 201 e status REQUESTED")
  void mi01AdminCriaManutencaoComSucesso() {
    var ativo = criarAtivo("ASSET-MI01");
    String token = loginComoAdmin();

    MockMvcResponse response =
        apiClient.criarManutencao(ativo.getId(), "Troca do teclado com defeito", token);

    assertThat(response.statusCode()).isEqualTo(201);
    assertThat((String) response.path("status")).isEqualTo("REQUESTED");
    assertThat((String) response.path("description")).isEqualTo("Troca do teclado com defeito");
    assertThat(((Number) response.path("assetId")).longValue()).isEqualTo(ativo.getId());
    assertThat((Object) response.path("id")).isNotNull();
    assertThat((Object) response.path("createdAt")).isNotNull();
  }

  @Test
  @Story("Criação de manutenção")
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("MI02 - GESTOR cria manutenção na sua unidade — retorna 201")
  void mi02GestorCriaManutencaoNaSuaUnidade() {
    var ativo = criarAtivo("ASSET-MI02");
    String token = loginComoGestor();

    MockMvcResponse response =
        apiClient.criarManutencao(ativo.getId(), "Substituição do carregador", token);

    assertThat(response.statusCode()).isEqualTo(201);
    assertThat((String) response.path("status")).isEqualTo("REQUESTED");
  }

  @Test
  @Story("Controle de acesso")
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("MI03 - OPERADOR não pode criar manutenção — retorna 403")
  void mi03OperadorNaoPodeCriarManutencao() {
    var ativo = criarAtivo("ASSET-MI03");
    String token = loginComoOperador();

    MockMvcResponse response =
        apiClient.criarManutencao(ativo.getId(), "Descrição longa o suficiente", token);

    assertThat(response.statusCode()).isEqualTo(403);
  }

  @Test
  @Story("Controle de acesso")
  @Severity(SeverityLevel.BLOCKER)
  @DisplayName("MI04 - Criação sem autenticação — retorna 401")
  void mi04CriacaoSemAutenticacaoRetorna401() {
    var ativo = criarAtivo("ASSET-MI04");

    MockMvcResponse response =
        apiClient.postSemToken("/maintenance", java.util.Map.of(
            "assetId", ativo.getId(),
            "description", "Descrição longa o suficiente"));

    assertThat(response.statusCode()).isEqualTo(401);
  }

  @Test
  @Story("Criação de manutenção")
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("MI05 - Ativo inexistente — retorna 404")
  void mi05AtivoInexistenteRetorna404() {
    String token = loginComoAdmin();

    MockMvcResponse response =
        apiClient.criarManutencao(99999L, "Descrição longa o suficiente", token);

    assertThat(response.statusCode()).isEqualTo(404);
  }

  @Test
  @Story("Criação de manutenção")
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("MI06 - Ativo já em manutenção ativa — retorna 400")
  void mi06AtivoJaEmManutencaoRetorna400() {
    var ativo = criarAtivo("ASSET-MI06");
    String token = loginComoAdmin();

    apiClient.criarManutencao(ativo.getId(), "Primeira manutenção válida", token);

    MockMvcResponse response =
        apiClient.criarManutencao(ativo.getId(), "Segunda manutenção simultânea", token);

    assertThat(response.statusCode()).isEqualTo(400);
  }

  @Test
  @Story("Criação de manutenção")
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("MI07 - Descrição em branco — retorna 400 com mensagem de validação")
  void mi07DescricaoEmBrancoRetorna400() {
    var ativo = criarAtivo("ASSET-MI07");
    String token = loginComoAdmin();

    MockMvcResponse response = apiClient.criarManutencao(ativo.getId(), "  ", token);

    assertThat(response.statusCode()).isEqualTo(400);
  }

  @Test
  @Story("Criação de manutenção")
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("MI08 - Ativo aposentado (RETIRED) não aceita manutenção — retorna 400")
  void mi08AtivoAposentadoNaoAceitaManutencao() {
    var ativo = testDataHelper.criarAtivoAposentado(organizacao, unidade);
    String token = loginComoAdmin();

    MockMvcResponse response =
        apiClient.criarManutencao(ativo.getId(), "Tentativa em ativo aposentado", token);

    assertThat(response.statusCode()).isEqualTo(400);
  }

  @Test
  @Story("Criação de manutenção")
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("MI09 - Ativo em transferência (IN_TRANSFER) não aceita manutenção — retorna 400")
  void mi09AtivoEmTransferenciaNaoAceitaManutencao() {
    var ativo = testDataHelper.criarAtivoEmTransferencia(organizacao, unidade);
    String token = loginComoAdmin();

    MockMvcResponse response =
        apiClient.criarManutencao(ativo.getId(), "Tentativa em ativo em transferência", token);

    assertThat(response.statusCode()).isEqualTo(400);
  }
}

