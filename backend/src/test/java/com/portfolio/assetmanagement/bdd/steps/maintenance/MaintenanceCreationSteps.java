package com.portfolio.assetmanagement.bdd.steps.maintenance;

import static org.assertj.core.api.Assertions.assertThat;

import com.portfolio.assetmanagement.bdd.client.ApiClient;
import com.portfolio.assetmanagement.bdd.context.ScenarioContext;
import io.cucumber.java.pt.E;
import io.cucumber.java.pt.Quando;
import io.restassured.module.mockmvc.response.MockMvcResponse;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;

/** Steps de ações de criação de manutenção. */
public class MaintenanceCreationSteps {

  @Autowired private ApiClient apiClient;
  @Autowired private ScenarioContext context;
  @Autowired private MaintenanceStepsContext mainContext;

  // =========================================================
  // AÇÕES — CRIAÇÃO
  // =========================================================

  @E("que criei uma manutenção para o ativo {string} com descrição {string}")
  public void queCriei(String assetTag, String descricao) {
    Long assetId = context.getId("ativoId_" + assetTag);
    MockMvcResponse response = apiClient.criarManutencao(assetId, descricao, context.getToken());

    assertThat(response.statusCode())
        .as("Falha ao criar manutenção no setup do cenário")
        .isEqualTo(201);

    Long manutencaoId = ((Number) response.path("id")).longValue();
    mainContext.setManutencaoId(manutencaoId);
    context.setLastCreatedId(manutencaoId);
  }

  @Quando("solicito manutenção para o ativo {string} com descrição {string}")
  public void solicitoManutencao(String assetTag, String descricao) {
    Long assetId = context.getId("ativoId_" + assetTag);
    assertThat(assetId).as("Ativo '%s' não foi criado no Contexto", assetTag).isNotNull();

    MockMvcResponse response = apiClient.criarManutencao(assetId, descricao, context.getToken());
    setLastResponse(response);

    if (response.statusCode() == 201) {
      Long manutencaoId = ((Number) response.path("id")).longValue();
      mainContext.setManutencaoId(manutencaoId);
      context.setLastCreatedId(manutencaoId);
    }
  }

  @Quando("solicito manutenção para o ativo {string} com descrição longa de {int} caracteres")
  public void solicitoManutencaoComDescricaoLonga(String assetTag, int tamanho) {
    Long assetId = context.getId("ativoId_" + assetTag);
    assertThat(assetId).as("Ativo '%s' não foi criado no Contexto", assetTag).isNotNull();

    String descricao = "A".repeat(tamanho);
    MockMvcResponse response = apiClient.criarManutencao(assetId, descricao, context.getToken());
    setLastResponse(response);
  }

  @Quando("solicito manutenção para o ativo {string} com custo estimado inválido de {double}")
  public void solicitoManutencaoComCustoInvalido(String assetTag, double custo) {
    Long assetId = context.getId("ativoId_" + assetTag);
    assertThat(assetId).as("Ativo '%s' não foi criado no Contexto", assetTag).isNotNull();

    MockMvcResponse response =
        apiClient.criarManutencaoComCusto(assetId, "Descrição válida", custo, context.getToken());
    setLastResponse(response);
  }

  @Quando("solicito manutenção para o ativo com ID {string} com descrição {string}")
  public void solicitoManutencaoComIdInvalido(String assetIdStr, String descricao) {
    Long assetId = Long.parseLong(assetIdStr);
    MockMvcResponse response = apiClient.criarManutencao(assetId, descricao, context.getToken());
    setLastResponse(response);
  }

  @Quando("solicito manutenção para o ativo {string} com descrição {string} sem autenticação")
  public void solicitoManutencaoSemAutenticacao(String assetTag, String descricao) {
    Long assetId = context.getId("ativoId_" + assetTag);
    assertThat(assetId).as("Ativo '%s' não foi criado no Contexto", assetTag).isNotNull();

    MockMvcResponse response =
        apiClient.postSemToken(
            "/maintenance", Map.of("assetId", assetId, "description", descricao));
    setLastResponse(response);
  }

  // =========================================================
  // HELPERS INTERNOS
  // =========================================================

  private void setLastResponse(MockMvcResponse response) {
    context.setLastResponse(response);
  }
}
