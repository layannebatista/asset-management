package com.portfolio.assetmanagement.integration.asset;

import static org.assertj.core.api.Assertions.assertThat;

import com.portfolio.assetmanagement.domain.asset.entity.Asset;
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

@Epic("Backend")
@Feature("Integração — Assets")
@DisplayName("Aposentadoria de Ativos")
@Tag("testType=Integration")
@Tag("module=Asset")
class AssetRetireIntegrationTest extends BaseIntegrationTest {

  @Test
  @Story("Aposentadoria de ativo")
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("[INTEGRACAO][ASSET] ADMIN aposta ativo disponível com sucesso — retorna 200")
  void adminAposentaAtivoDisponivel() {
    Asset ativo = criarAtivo("RETIRE-001");
    String token = loginComoAdmin();

    MockMvcResponse response = apiClient.aposentarAtivo(ativo.getId(), token);
    assertThat(response.statusCode()).isEqualTo(200);
  }

  @Test
  @Story("Controle de acesso")
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("[INTEGRACAO][ASSET] GESTOR não pode aposentar — retorna 403")
  void gestorNaoPodeAposentar() {
    Asset ativo = criarAtivo("RETIRE-002");
    String token = loginComoGestor();

    MockMvcResponse response = apiClient.aposentarAtivo(ativo.getId(), token);
    assertThat(response.statusCode()).isEqualTo(403);
  }

  @Test
  @Story("Controle de acesso")
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("[INTEGRACAO][ASSET] User não pode aposentar ativo — retorna 403")
  void operadorNaoPodeAposentar() {
    Asset ativo = criarAtivo("RETIRE-003");
    String token = loginComoOperador();

    MockMvcResponse response = apiClient.aposentarAtivo(ativo.getId(), token);
    assertThat(response.statusCode()).isEqualTo(403);
  }

  @Test
  @Story("Aposentadoria de ativo")
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("[INTEGRACAO][ASSET] Aposentar ativo inexistente retorna 404")
  void aposentarAtivoInexistenteRetorna404() {
    String token = loginComoAdmin();
    MockMvcResponse response = apiClient.aposentarAtivo(99999L, token);
    assertThat(response.statusCode()).isEqualTo(404);
  }

  @Test
  @Story("Validação de estado")
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("[INTEGRACAO][ASSET] ADMIN aposta ativo já aposentado retorna 400")
  void aposentarAtivoJaAposentadoRetorna400() {
    Asset ativo = criarAtivo("RETIRE-004");
    String token = loginComoAdmin();

    // Aposta pela primeira vez — deve suceder
    MockMvcResponse primeiraVez = apiClient.aposentarAtivo(ativo.getId(), token);
    assertThat(primeiraVez.statusCode()).isEqualTo(200);

    // Tenta aposentar novamente — deve falhar com 400 (ativo já está RETIRED)
    MockMvcResponse segundaVez = apiClient.aposentarAtivo(ativo.getId(), token);
    assertThat(segundaVez.statusCode()).isEqualTo(400);
  }

  @Test
  @Story("Validação de estado")
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("[INTEGRACAO][ASSET] Aposentar ativo em manutenção retorna 400")
  void aposentarAtivoEmManutencaoRetorna400() {
    Asset ativo = testDataHelper.criarAtivoEmManutencao(organizacao, unidade);
    String token = loginComoAdmin();

    MockMvcResponse response = apiClient.aposentarAtivo(ativo.getId(), token);

    assertThat(response.statusCode()).isEqualTo(400);
  }

  @Test
  @Story("Validação de estado")
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName(
      "[INTEGRACAO][ASSET] AR07 - Aposentar ativo com transferência PENDING ativa retorna 400")
  void ar07AposentarAtivoComTransferenciaPendenteRetorna400() {
    Asset ativo = criarAtivo("RETIRE-007");
    String token = loginComoAdmin();

    // Cria uma unidade de destino e solicita transferência (ativo fica IN_TRANSFER)
    var unidadeDestino = testDataHelper.criarUnidade("Destino", organizacao);
    apiClient.solicitarTransferencia(
        ativo.getId(), unidadeDestino.getId(), "Motivo de transferência", token);

    // Tenta aposentar o ativo que está com transferência pendente — deve falhar
    MockMvcResponse response = apiClient.aposentarAtivo(ativo.getId(), token);

    assertThat(response.statusCode()).isEqualTo(400);
  }
}
