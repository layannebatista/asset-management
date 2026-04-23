package com.portfolio.assetmanagement.bdd.steps.maintenance;

import static org.assertj.core.api.Assertions.assertThat;

import com.portfolio.assetmanagement.bdd.client.ApiClient;
import com.portfolio.assetmanagement.bdd.context.ScenarioContext;
import io.cucumber.java.pt.E;
import io.cucumber.java.pt.Quando;
import io.restassured.module.mockmvc.response.MockMvcResponse;
import org.springframework.beans.factory.annotation.Autowired;

/** Steps de ações de ciclo de vida da manutenção (início, conclusão, cancelamento). */
public class MaintenanceLifecycleSteps {

  @Autowired private ApiClient apiClient;
  @Autowired private ScenarioContext context;
  @Autowired private MaintenanceStepsContext mainContext;

  // =========================================================
  // AÇÕES — INÍCIO
  // =========================================================

  @E("que iniciei essa manutenção")
  public void queIniciei() {
    MockMvcResponse response =
        apiClient.iniciarManutencao(mainContext.getManutencaoId(), context.getToken());
    assertThat(response.statusCode())
        .as("Falha ao iniciar manutenção no setup do cenário")
        .isEqualTo(200);
  }

  @Quando("inicio a manutenção salva")
  public void inicioAManutencaoSalva() {
    Long manutencaoId = mainContext.getManutencaoId();
    MockMvcResponse response = apiClient.iniciarManutencao(manutencaoId, context.getToken());
    setLastResponse(response);
  }

  // =========================================================
  // AÇÕES — CONCLUSÃO
  // =========================================================

  @E("que concluí essa manutenção com resolução {string}")
  public void queConclui(String resolucao) {
    MockMvcResponse response =
        apiClient.concluirManutencao(mainContext.getManutencaoId(), resolucao, context.getToken());
    assertThat(response.statusCode())
        .as("Falha ao concluir manutenção no setup do cenário")
        .isEqualTo(200);
  }

  @Quando("concluo a manutenção salva com resolução {string}")
  public void concluoAManutencaoSalva(String resolucao) {
    Long manutencaoId = mainContext.getManutencaoId();
    MockMvcResponse response = apiClient.concluirManutencao(manutencaoId, resolucao, context.getToken());
    setLastResponse(response);
  }

  @Quando("concluo a manutenção salva sem enviar resolution")
  public void concluoAManutencaoSalvaSemEnviarResolution() {
    Long manutencaoId = mainContext.getManutencaoId();
    MockMvcResponse response = apiClient.concluirManutencaoSemResolucao(manutencaoId, context.getToken());
    setLastResponse(response);
  }

  // =========================================================
  // AÇÕES — CANCELAMENTO
  // =========================================================

  @E("que cancelei essa manutenção")
  public void queCanceleiEssaManutencao() {
    MockMvcResponse response =
        apiClient.cancelarManutencao(mainContext.getManutencaoId(), context.getToken());
    assertThat(response.statusCode())
        .as("Falha ao cancelar manutenção no setup do cenário")
        .isEqualTo(200);
  }

  @Quando("cancelo a manutenção salva")
  public void canceloAManutencaoSalva() {
    Long manutencaoId = mainContext.getManutencaoId();
    MockMvcResponse response = apiClient.cancelarManutencao(manutencaoId, context.getToken());
    setLastResponse(response);
  }

  // =========================================================
  // HELPERS INTERNOS
  // =========================================================

  private void setLastResponse(MockMvcResponse response) {
    context.setLastResponse(response);
  }
}
