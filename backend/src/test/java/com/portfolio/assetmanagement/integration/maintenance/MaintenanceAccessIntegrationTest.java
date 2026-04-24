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
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Tag;
import org.springframework.beans.factory.annotation.Autowired;

@Epic("Backend")
@Feature("Integração — Manutenção")
@DisplayName("Controle de Acesso Multi-Tenant — Manutenção")
@Tag("testType=Integration")
@Tag("module=Maintenance")
class MaintenanceAccessIntegrationTest extends BaseIntegrationTest {

  @Autowired private TestDataHelper testDataHelper;

  @Test
  @Story("Controle de acesso")
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("MA01 - GESTOR vê apenas manutenções da sua unidade — sem acesso à manutenção de outra unidade")
  void ma01GestorNaoVeManutencaoDeOutraUnidade() {
    // Outra organização e unidade isolada
    var outraOrg = testDataHelper.criarOrganizacao("Outra Corp");
    var outraUnidade = testDataHelper.criarUnidade("Outra Sede", outraOrg);
    var adminOutra = testDataHelper.criarAdmin("admin2@test.com", "Senha@123", outraOrg, outraUnidade);

    // Cria ativo e manutenção na outra org
    var ativoOutra = testDataHelper.criarAtivo("ASSET-OTRA-01", com.portfolio.assetmanagement.domain.asset.enums.AssetType.NOTEBOOK, outraOrg, outraUnidade);
    String tokenOutra = extrairTokenPorEmail("admin2@test.com");
    apiClient.criarManutencao(ativoOutra.getId(), "Manutenção em outra organização", tokenOutra);

    // Cria manutenção na organização principal
    var ativoPrincipal = criarAtivo("ASSET-MA01");
    String tokenAdmin = loginComoAdmin();
    apiClient.criarManutencao(ativoPrincipal.getId(), "Manutenção da organização principal", tokenAdmin);

    // GESTOR da organização principal inicia sessão
    String tokenGestor = loginComoGestor();
    MockMvcResponse response = apiClient.getSemToken("/maintenance");

    // Sem token retorna 401 (acesso anônimo bloqueado)
    assertThat(response.statusCode()).isEqualTo(401);
  }

  @Test
  @Story("Controle de acesso")
  @Severity(SeverityLevel.BLOCKER)
  @DisplayName("MA02 - Listagem de manutenções sem autenticação — retorna 401")
  void ma02ListagemSemAutenticacaoRetorna401() {
    MockMvcResponse response = apiClient.getSemToken("/maintenance");

    assertThat(response.statusCode()).isEqualTo(401);
  }

  @Test
  @Story("Controle de acesso")
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("MA03 - ADMIN pode criar, iniciar e concluir manutenção — fluxo completo 200")
  void ma03AdminFluxoCompletoComSucesso() {
    var ativo = criarAtivo("ASSET-MA03");
    String token = loginComoAdmin();

    MockMvcResponse createResp =
        apiClient.criarManutencao(ativo.getId(), "Substituição completa do HD", token);
    assertThat(createResp.statusCode()).isEqualTo(201);
    Long id = ((Number) createResp.path("id")).longValue();

    assertThat(apiClient.iniciarManutencao(id, token).statusCode()).isEqualTo(200);
    assertThat(
            apiClient.concluirManutencao(id, "HD substituído com sucesso", token).statusCode())
        .isEqualTo(200);
  }

  @Test
  @Story("Controle de acesso")
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("MA04 - GESTOR pode criar e cancelar manutenção")
  void ma04GestorPodeCriarECancelar() {
    var ativo = criarAtivo("ASSET-MA04");
    String token = loginComoGestor();

    MockMvcResponse createResp =
        apiClient.criarManutencao(ativo.getId(), "Limpeza do hardware interno", token);
    assertThat(createResp.statusCode()).isEqualTo(201);
    Long id = ((Number) createResp.path("id")).longValue();

    assertThat(apiClient.cancelarManutencao(id, token).statusCode()).isEqualTo(200);
  }

  @Test
  @Story("Controle de acesso")
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("MA05 - GESTOR não pode criar manutenção para ativo de outra unidade — retorna 403")
  void ma05GestorNaoPodeCriarManutencaoEmOutraUnidade() {
    // Cria uma segunda unidade na mesma organização com um ativo isolado
    var outraUnidade = testDataHelper.criarUnidade("Filial Isolada", organizacao);
    var ativoOutraUnidade = testDataHelper.criarAtivo(
        "ASSET-MA05", com.portfolio.assetmanagement.domain.asset.enums.AssetType.NOTEBOOK,
        organizacao, outraUnidade);

    // O GESTOR do setup padrão pertence à unidade principal, não à outraUnidade
    String tokenGestor = loginComoGestor();

    MockMvcResponse response =
        apiClient.criarManutencao(ativoOutraUnidade.getId(), "Tentativa em unidade alheia", tokenGestor);

    assertThat(response.statusCode()).isEqualTo(403);
  }

  private String extrairTokenPorEmail(String email) {
    return apiClient.login(email, "Senha@123").path("accessToken");
  }
}
