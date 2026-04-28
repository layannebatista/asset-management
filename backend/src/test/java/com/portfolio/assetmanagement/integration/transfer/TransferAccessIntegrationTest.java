package com.portfolio.assetmanagement.integration.transfer;

import static io.restassured.module.mockmvc.RestAssuredMockMvc.given;
import static org.assertj.core.api.Assertions.assertThat;

import com.portfolio.assetmanagement.domain.asset.entity.Asset;
import com.portfolio.assetmanagement.domain.unit.entity.Unit;
import com.portfolio.assetmanagement.integration.BaseIntegrationTest;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import io.qameta.allure.Story;
import io.restassured.http.ContentType;
import io.restassured.module.mockmvc.response.MockMvcResponse;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

@Epic("Backend")
@Feature("Integração — Transfer")
@DisplayName("Controle de Acesso em Transfer")
@Tag("testType=Integration")
@Tag("module=Transfer")
class TransferAccessIntegrationTest extends BaseIntegrationTest {

  @Test
  @Story("Proteção de endpoints")
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("[INTEGRACAO][ASSET] TAI01 - Listagem sem autenticação retorna 401")
  void tai01ListagemSemAutenticacaoRetorna401() {
    MockMvcResponse response = apiClient.getSemToken("/transfers");

    assertThat(response.statusCode()).isEqualTo(401);
  }

  @Test
  @Story("Proteção de endpoints")
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("[INTEGRACAO][ASSET] TAI02 - Aprovação sem autenticação retorna 401")
  void tai02AprovacaoSemAutenticacaoRetorna401() {
    MockMvcResponse response =
        given()
            .contentType(ContentType.JSON)
            .body(Map.of("comment", "Sem token"))
            .when()
            .patch("/transfers/{id}/approve", 99999L)
            .then()
            .extract()
            .response();

    assertThat(response.statusCode()).isEqualTo(401);
  }

  @Test
  @Story("Controle de acesso")
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("[INTEGRACAO][ASSET] TAI03 - OPERADOR não pode aprovar transferência")
  void tai03OperadorNaoPodeAprovarTransferencia() {
    Unit destino = testDataHelper.criarUnidade("Filial TAI03", organizacao);
    Asset asset = criarAtivo("TRANSFER-ACC-03");
    String adminToken = loginComoAdmin();
    Long transferId =
        ((Number)
                apiClient
                    .solicitarTransferencia(
                        asset.getId(), destino.getId(), "Aguardando decisão", adminToken)
                    .path("id"))
            .longValue();

    MockMvcResponse response =
        apiClient.aprovarTransferencia(transferId, "Sem permissão", loginComoOperador());

    assertThat(response.statusCode()).isEqualTo(403);
  }

  @Test
  @Story("Controle de acesso")
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName(
      "[INTEGRACAO][ASSET] TAI04 - GESTOR de outra unidade não pode aprovar transferência alheia")
  void tai04GestorDeOutraUnidadeNaoPodeAprovarTransferenciaAlheia() {
    Unit outraUnidade = testDataHelper.criarUnidade("Filial TAI04", organizacao);
    Unit terceiraUnidade = testDataHelper.criarUnidade("Filial TAI04-B", organizacao);
    testDataHelper.criarGestor(
        "gestor-outra-transfer@test.com", "Senha@123", organizacao, outraUnidade);
    Asset asset = criarAtivo("TRANSFER-ACC-04");
    String adminToken = loginComoAdmin();
    Long transferId =
        ((Number)
                apiClient
                    .solicitarTransferencia(
                        asset.getId(), terceiraUnidade.getId(), "Escopo alheio", adminToken)
                    .path("id"))
            .longValue();
    String outroGestorToken =
        apiClient.login("gestor-outra-transfer@test.com", "Senha@123").path("accessToken");

    MockMvcResponse response =
        apiClient.aprovarTransferencia(transferId, "Sem acesso à unidade", outroGestorToken);

    assertThat(response.statusCode()).isEqualTo(403);
  }
}
