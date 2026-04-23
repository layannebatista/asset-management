package com.portfolio.assetmanagement.integration.maintenance;

import static org.assertj.core.api.Assertions.assertThat;

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
@Feature("Integração — Manutenção")
@DisplayName("Ciclo de Vida da Manutenção")
class MaintenanceLifecycleIntegrationTest extends BaseIntegrationTest {

  private Long criarManutencaoEObterIdComoAdmin(String assetTag) {
    var ativo = criarAtivo(assetTag);
    String token = loginComoAdmin();
    MockMvcResponse resp =
        apiClient.criarManutencao(ativo.getId(), "Descrição válida da manutenção", token);
    assertThat(resp.statusCode()).isEqualTo(201);
    return ((Number) resp.path("id")).longValue();
  }

  @Test
  @Story("Execução de manutenção")
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("ML01 - ADMIN inicia manutenção REQUESTED — retorna 200 e status IN_PROGRESS")
  void ml01AdminIniciaManutencao() {
    Long maintenanceId = criarManutencaoEObterIdComoAdmin("ASSET-ML01");
    String token = loginComoAdmin();

    MockMvcResponse response = apiClient.iniciarManutencao(maintenanceId, token);

    assertThat(response.statusCode()).isEqualTo(200);
    assertThat((String) response.path("status")).isEqualTo("IN_PROGRESS");
    assertThat((Object) response.path("startedAt")).isNotNull();
  }

  @Test
  @Story("Execução de manutenção")
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("ML02 - ADMIN conclui manutenção IN_PROGRESS — retorna 200 e status COMPLETED")
  void ml02AdminConclui() {
    Long maintenanceId = criarManutencaoEObterIdComoAdmin("ASSET-ML02");
    String token = loginComoAdmin();
    apiClient.iniciarManutencao(maintenanceId, token);

    MockMvcResponse response =
        apiClient.concluirManutencao(maintenanceId, "Peça trocada com sucesso", token);

    assertThat(response.statusCode()).isEqualTo(200);
    assertThat((String) response.path("status")).isEqualTo("COMPLETED");
    assertThat((String) response.path("resolution")).isEqualTo("Peça trocada com sucesso");
    assertThat((Object) response.path("completedAt")).isNotNull();
  }

  @Test
  @Story("Execução de manutenção")
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("ML03 - ADMIN cancela manutenção REQUESTED — retorna 200 e status CANCELLED")
  void ml03AdminCancelaManutencaoRequested() {
    Long maintenanceId = criarManutencaoEObterIdComoAdmin("ASSET-ML03");
    String token = loginComoAdmin();

    MockMvcResponse response = apiClient.cancelarManutencao(maintenanceId, token);

    assertThat(response.statusCode()).isEqualTo(200);
    assertThat((String) response.path("status")).isEqualTo("CANCELLED");
  }

  @Test
  @Story("Execução de manutenção")
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("ML04 - Concluir manutenção sem resolução — retorna 400")
  void ml04ConcluirSemResolucaoRetorna400() {
    Long maintenanceId = criarManutencaoEObterIdComoAdmin("ASSET-ML04");
    String token = loginComoAdmin();
    apiClient.iniciarManutencao(maintenanceId, token);

    MockMvcResponse response = apiClient.concluirManutencaoSemResolucao(maintenanceId, token);

    assertThat(response.statusCode()).isEqualTo(400);
  }

  @Test
  @Story("Execução de manutenção")
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("ML05 - Iniciar manutenção inexistente — retorna 404")
  void ml05IniciarManutencaoInexistente() {
    String token = loginComoAdmin();

    MockMvcResponse response = apiClient.iniciarManutencao(99999L, token);

    assertThat(response.statusCode()).isEqualTo(404);
  }

  @Test
  @Story("Controle de acesso")
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("ML06 - OPERADOR não pode cancelar manutenção — retorna 403")
  void ml06OperadorNaoPodeCancelar() {
    Long maintenanceId = criarManutencaoEObterIdComoAdmin("ASSET-ML06");
    String token = loginComoOperador();

    MockMvcResponse response = apiClient.cancelarManutencao(maintenanceId, token);

    assertThat(response.statusCode()).isEqualTo(403);
  }

  @Test
  @Story("Execução de manutenção")
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("ML07 - Conclusão restaura status do ativo para AVAILABLE quando sem usuário")
  void ml07ConclusaoRestaurStatusAtivoParaAvailable() {
    var ativo = criarAtivo("ASSET-ML07");
    String token = loginComoAdmin();

    MockMvcResponse createResp =
        apiClient.criarManutencao(ativo.getId(), "Descrição válida da manutenção", token);
    Long maintenanceId = ((Number) createResp.path("id")).longValue();
    apiClient.iniciarManutencao(maintenanceId, token);
    apiClient.concluirManutencao(maintenanceId, "Resolvido com sucesso", token);

    MockMvcResponse ativoResp = apiClient.buscarAtivo(ativo.getId(), token);
    assertThat((String) ativoResp.path("status")).isEqualTo("AVAILABLE");
  }
}

