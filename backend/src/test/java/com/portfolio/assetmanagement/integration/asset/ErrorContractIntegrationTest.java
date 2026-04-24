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
import org.junit.jupiter.api.Test;

@Epic("Backend")
@Feature("Integração — Contratos de Erro")
@DisplayName("Contratos de Resposta de Erro")
@Tag("testType=Integration")
@Tag("module=Asset")
class ErrorContractIntegrationTest extends BaseIntegrationTest {

  @Test
  @Story("Contrato 400")
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("Resposta 400 contém campos obrigatórios do contrato de erro")
  void resposta400ContémCamposDoContrato() {
    String token = loginComoAdmin();
    MockMvcResponse response = apiClient.criarAtivoComDadosInvalidos(organizacao.getId(), token);

    assertThat(response.statusCode()).isEqualTo(400);
    String body = response.getBody().asString();
    // Verifica que não é resposta genérica do Spring (sem stack trace exposto)
    assertThat(body).doesNotContain("\"status\":500");
    assertThat(body).doesNotContain("\"trace\":");
  }

  @Test
  @Story("Contrato 401")
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("Resposta 401 está no formato JSON")
  void resposta401EmJson() {
    MockMvcResponse response = apiClient.getSemToken("/assets");

    assertThat(response.statusCode()).isEqualTo(401);
    assertThat(response.contentType()).containsIgnoringCase("application/json");
  }

  @Test
  @Story("Contrato 403")
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("Resposta 403 não expõe informações internas")
  void resposta403NaoExpoeInformacoes() {
    criarAtivo("ERR-CONTRACT-001");
    String token = loginComoGestor();

    // Cria o ativo e usa o ID retornado diretamente — evita dependência de ordenação da listagem
    Asset ativoParaAposentar = criarAtivo("ERR-RETIRE-001");
    Long assetId = ativoParaAposentar.getId();

    MockMvcResponse response = apiClient.aposentarAtivo(assetId, token);

    assertThat(response.statusCode()).isEqualTo(403);
    String body = response.getBody().asString();
    assertThat(body).doesNotContain("\"trace\":");
    assertThat(body).doesNotContain("NullPointerException");
  }

  @Test
  @Story("Contrato 404")
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("Resposta 404 está no formato JSON com mensagem")
  void resposta404EmJson() {
    String token = loginComoAdmin();
    MockMvcResponse response = apiClient.buscarAtivo(99999L, token);

    assertThat(response.statusCode()).isEqualTo(404);
    assertThat(response.contentType()).containsIgnoringCase("application/json");
    String body = response.getBody().asString();
    assertThat(body).doesNotContain("\"status\":500");
  }

  @Test
  @Story("Contrato 404")
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("Deve retornar 404 se ativo não existir")
  void retorna404ParaAtivoInexistente() {
    String token = loginComoAdmin();
    MockMvcResponse response = apiClient.buscarAtivo(99999L, token);
    assertThat(response.statusCode()).isEqualTo(404);
  }
}
