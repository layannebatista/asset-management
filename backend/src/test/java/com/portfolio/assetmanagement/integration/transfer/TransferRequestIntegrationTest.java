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
import org.junit.jupiter.api.Tag;

@Epic("Backend")
@Feature("Integração — Transfer")
@DisplayName("Solicitação de Transferência")
@Tag("testType=Integration")
@Tag("module=Transfer")
class TransferRequestIntegrationTest extends BaseIntegrationTest {

  private Unit criarOutraUnidade(String nome) {
    return testDataHelper.criarUnidade(nome, organizacao);
  }

  @Test
  @Story("Solicitação")
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("TRI01 - ADMIN solicita transferência com sucesso e recebe status PENDING")
  void tri01AdminSolicitaTransferenciaComSucesso() {
    Asset asset = criarAtivo("TRANSFER-REQ-01");
    Unit destino = criarOutraUnidade("Filial TRI01");

    MockMvcResponse response =
        apiClient.solicitarTransferencia(
            asset.getId(), destino.getId(), "Mudança de unidade operacional", loginComoAdmin());

    assertThat(response.statusCode()).isEqualTo(201);
    assertThat((String) response.path("status")).isEqualTo("PENDING");
    assertThat(((Number) response.path("assetId")).longValue()).isEqualTo(asset.getId());
    assertThat(((Number) response.path("fromUnitId")).longValue()).isEqualTo(unidade.getId());
    assertThat(((Number) response.path("toUnitId")).longValue()).isEqualTo(destino.getId());
    assertThat((String) response.path("reason")).isEqualTo("Mudança de unidade operacional");
    assertThat((Object) response.path("requestedAt")).isNotNull();
  }

  @Test
  @Story("Solicitação")
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("TRI02 - GESTOR solicita transferência com sucesso")
  void tri02GestorSolicitaTransferenciaComSucesso() {
    Asset asset = criarAtivo("TRANSFER-REQ-02");
    Unit destino = criarOutraUnidade("Filial TRI02");

    MockMvcResponse response =
        apiClient.solicitarTransferencia(
            asset.getId(), destino.getId(), "Realocação planejada", loginComoGestor());

    assertThat(response.statusCode()).isEqualTo(201);
    assertThat((String) response.path("status")).isEqualTo("PENDING");
  }

  @Test
  @Story("Solicitação")
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("TRI03 - OPERADOR não pode solicitar transferência")
  void tri03OperadorNaoPodeSolicitarTransferencia() {
    Asset asset = criarAtivo("TRANSFER-REQ-03");
    Unit destino = criarOutraUnidade("Filial TRI03");

    MockMvcResponse response =
        apiClient.solicitarTransferencia(
            asset.getId(), destino.getId(), "Tentativa sem permissão", loginComoOperador());

    assertThat(response.statusCode()).isEqualTo(403);
  }

  @Test
  @Story("Solicitação")
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("TRI04 - Solicitação sem autenticação retorna 401")
  void tri04SolicitacaoSemAutenticacaoRetorna401() {
    Asset asset = criarAtivo("TRANSFER-REQ-04");
    Unit destino = criarOutraUnidade("Filial TRI04");

    MockMvcResponse response =
        given()
            .contentType(ContentType.JSON)
            .body(
                Map.of(
                    "assetId", asset.getId(),
                    "toUnitId", destino.getId(),
                    "reason", "Sem token"))
            .when()
            .post("/transfers")
            .then()
            .extract()
            .response();

    assertThat(response.statusCode()).isEqualTo(401);
  }

  @Test
  @Story("Solicitação")
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("TRI05 - Solicitação para a mesma unidade retorna 400")
  void tri05SolicitacaoParaMesmaUnidadeRetorna400() {
    Asset asset = criarAtivo("TRANSFER-REQ-05");

    MockMvcResponse response =
        apiClient.solicitarTransferencia(
            asset.getId(), unidade.getId(), "Tentativa inválida", loginComoAdmin());

    assertThat(response.statusCode()).isEqualTo(400);
  }

  @Test
  @Story("Solicitação")
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("TRI06 - Ativo inexistente retorna 404")
  void tri06AtivoInexistenteRetorna404() {
    Unit destino = criarOutraUnidade("Filial TRI06");

    MockMvcResponse response =
        apiClient.solicitarTransferencia(
            99999L, destino.getId(), "Ativo ausente", loginComoAdmin());

    assertThat(response.statusCode()).isEqualTo(404);
  }

  @Test
  @Story("Solicitação")
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("TRI07 - Unidade destino inexistente retorna 404")
  void tri07UnidadeDestinoInexistenteRetorna404() {
    Asset asset = criarAtivo("TRANSFER-REQ-07");

    MockMvcResponse response =
        apiClient.solicitarTransferencia(asset.getId(), 99999L, "Destino ausente", loginComoAdmin());

    assertThat(response.statusCode()).isEqualTo(404);
  }

  @Test
  @Story("Solicitação")
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("TRI08 - Ativo com transferência ativa não aceita nova solicitação")
  void tri08AtivoComTransferenciaAtivaNaoAceitaNovaSolicitacao() {
    Asset asset = criarAtivo("TRANSFER-REQ-08");
    Unit destinoA = criarOutraUnidade("Filial TRI08-A");
    Unit destinoB = criarOutraUnidade("Filial TRI08-B");
    String token = loginComoAdmin();

    MockMvcResponse primeira =
        apiClient.solicitarTransferencia(asset.getId(), destinoA.getId(), "Primeira", token);
    MockMvcResponse segunda =
        apiClient.solicitarTransferencia(asset.getId(), destinoB.getId(), "Segunda", token);

    assertThat(primeira.statusCode()).isEqualTo(201);
    assertThat(segunda.statusCode()).isEqualTo(400);
  }

  @Test
  @Story("Solicitação")
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("TRI09 - Ativo em manutenção não pode ser transferido")
  void tri09AtivoEmManutencaoNaoPodeSerTransferido() {
    Asset asset = testDataHelper.criarAtivoEmManutencao(organizacao, unidade);
    Unit destino = criarOutraUnidade("Filial TRI09");

    MockMvcResponse response =
        apiClient.solicitarTransferencia(asset.getId(), destino.getId(), "Bloqueio por manutenção", loginComoAdmin());

    assertThat(response.statusCode()).isEqualTo(400);
  }
}
