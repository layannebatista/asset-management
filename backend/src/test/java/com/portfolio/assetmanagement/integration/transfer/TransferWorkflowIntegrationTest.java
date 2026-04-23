package com.portfolio.assetmanagement.integration.transfer;

import static org.assertj.core.api.Assertions.assertThat;

import com.portfolio.assetmanagement.domain.asset.entity.Asset;
import com.portfolio.assetmanagement.domain.unit.entity.Unit;
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
@Feature("Integração — Transfer")
@DisplayName("Fluxo de Transferência")
class TransferWorkflowIntegrationTest extends BaseIntegrationTest {

  private Long criarTransferenciaPendente(String assetTag, String token, Unit destino) {
    Asset asset = criarAtivo(assetTag);
    MockMvcResponse response =
        apiClient.solicitarTransferencia(asset.getId(), destino.getId(), "Fluxo padrão", token);
    assertThat(response.statusCode()).isEqualTo(201);
    return ((Number) response.path("id")).longValue();
  }

  @Test
  @Story("Decisão")
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("TWF01 - ADMIN aprova transferência pendente")
  void twf01AdminAprovaTransferenciaPendente() {
    Unit destino = testDataHelper.criarUnidade("Filial TWF01", organizacao);
    Long transferId = criarTransferenciaPendente("TRANSFER-WF-01", loginComoAdmin(), destino);

    MockMvcResponse response =
        apiClient.aprovarTransferencia(transferId, "Aprovado", loginComoAdmin());

    assertThat(response.statusCode()).isEqualTo(204);
  }

  @Test
  @Story("Decisão")
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("TWF02 - ADMIN rejeita transferência pendente e ativo volta para AVAILABLE")
  void twf02AdminRejeitaTransferenciaEPassaAtivoParaAvailable() {
    Unit destino = testDataHelper.criarUnidade("Filial TWF02", organizacao);
    Asset asset = criarAtivo("TRANSFER-WF-02");
    String token = loginComoAdmin();
    MockMvcResponse createResponse =
        apiClient.solicitarTransferencia(asset.getId(), destino.getId(), "Rejeitar fluxo", token);
    Long transferId = ((Number) createResponse.path("id")).longValue();

    MockMvcResponse rejectResponse = apiClient.rejeitarTransferencia(transferId, "Rejeitada", token);
    MockMvcResponse assetResponse = apiClient.buscarAtivo(asset.getId(), token);

    assertThat(rejectResponse.statusCode()).isEqualTo(204);
    assertThat((String) assetResponse.path("status")).isEqualTo("AVAILABLE");
  }

  @Test
  @Story("Conclusão")
  @Severity(SeverityLevel.BLOCKER)
  @DisplayName("TWF03 - Concluir transferência aprovada move ativo para unidade destino")
  void twf03ConcluirTransferenciaAprovadaMoveAtivoParaUnidadeDestino() {
    Unit destino = testDataHelper.criarUnidade("Filial TWF03", organizacao);
    Asset asset = criarAtivo("TRANSFER-WF-03");
    String token = loginComoAdmin();
    MockMvcResponse createResponse =
        apiClient.solicitarTransferencia(asset.getId(), destino.getId(), "Completar fluxo", token);
    Long transferId = ((Number) createResponse.path("id")).longValue();
    apiClient.aprovarTransferencia(transferId, "Aprovado", token);

    MockMvcResponse completeResponse = apiClient.concluirTransferencia(transferId, token);
    MockMvcResponse assetResponse = apiClient.buscarAtivo(asset.getId(), token);

    assertThat(completeResponse.statusCode()).isEqualTo(204);
    assertThat((String) assetResponse.path("status")).isEqualTo("AVAILABLE");
    assertThat(((Number) assetResponse.path("unitId")).longValue()).isEqualTo(destino.getId());
  }

  @Test
  @Story("Conclusão")
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("TWF04 - Concluir transferência sem aprovação retorna 400")
  void twf04ConcluirTransferenciaSemAprovacaoRetorna400() {
    Unit destino = testDataHelper.criarUnidade("Filial TWF04", organizacao);
    Long transferId = criarTransferenciaPendente("TRANSFER-WF-04", loginComoAdmin(), destino);

    MockMvcResponse response = apiClient.concluirTransferencia(transferId, loginComoAdmin());

    assertThat(response.statusCode()).isEqualTo(400);
  }

  @Test
  @Story("Cancelamento")
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("TWF05 - Cancelar transferência pendente retorna 204 e ativo volta para AVAILABLE")
  void twf05CancelarTransferenciaPendenteRetorna204() {
    Unit destino = testDataHelper.criarUnidade("Filial TWF05", organizacao);
    Asset asset = criarAtivo("TRANSFER-WF-05");
    String token = loginComoAdmin();
    MockMvcResponse createResponse =
        apiClient.solicitarTransferencia(asset.getId(), destino.getId(), "Cancelar fluxo", token);
    Long transferId = ((Number) createResponse.path("id")).longValue();

    MockMvcResponse cancelResponse = apiClient.cancelarTransferencia(transferId, token);
    MockMvcResponse assetResponse = apiClient.buscarAtivo(asset.getId(), token);

    assertThat(cancelResponse.statusCode()).isEqualTo(204);
    assertThat((String) assetResponse.path("status")).isEqualTo("AVAILABLE");
  }

  @Test
  @Story("Decisão")
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("TWF06 - Aprovar transferência inexistente retorna 404")
  void twf06AprovarTransferenciaInexistenteRetorna404() {
    MockMvcResponse response =
        apiClient.aprovarTransferencia(99999L, "Inexistente", loginComoAdmin());

    assertThat(response.statusCode()).isEqualTo(404);
  }

  @Test
  @Story("Cancelamento")
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("TWF07 - Cancelar transferência já aprovada retorna 400")
  void twf07CancelarTransferenciaJaAprovadaRetorna400() {
    Unit destino = testDataHelper.criarUnidade("Filial TWF07", organizacao);
    Long transferId = criarTransferenciaPendente("TRANSFER-WF-07", loginComoAdmin(), destino);
    String token = loginComoAdmin();
    apiClient.aprovarTransferencia(transferId, "Aprovado", token);

    MockMvcResponse response = apiClient.cancelarTransferencia(transferId, token);

    assertThat(response.statusCode()).isEqualTo(400);
  }
}