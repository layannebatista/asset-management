package com.portfolio.assetmanagement.bdd.actions;

import com.portfolio.assetmanagement.bdd.client.ApiClient;
import com.portfolio.assetmanagement.bdd.context.ScenarioContext;
import com.portfolio.assetmanagement.bdd.support.TestDataHelper;
import io.restassured.module.mockmvc.response.MockMvcResponse;
import org.springframework.stereotype.Component;

@Component
public class AssetActions {

  private final ApiClient apiClient;
  private final ScenarioContext context;
  private final TestDataHelper testDataHelper;

  public AssetActions(ApiClient apiClient, ScenarioContext context, TestDataHelper testDataHelper) {
    this.apiClient = apiClient;
    this.context = context;
    this.testDataHelper = testDataHelper;
  }

  public MockMvcResponse assign(String assetTag, String userEmail) {
    Long assetId = context.getId("ativoId_" + assetTag);
    Long userId = testDataHelper.obterIdUsuarioPorEmail(userEmail);
    MockMvcResponse response = apiClient.atribuirAtivo(assetId, userId, context.getToken());
    context.setLastResponse(response);
    context.setId("usuarioAtribuidoId", userId);
    context.setValue("ativoTagAtual", assetTag);
    return response;
  }

  public MockMvcResponse unassign(String assetTag) {
    Long assetId = context.getId("ativoId_" + assetTag);
    MockMvcResponse response = apiClient.desatribuirAtivo(assetId, context.getToken());
    context.setLastResponse(response);
    context.setValue("ativoTagAtual", assetTag);
    return response;
  }

  public MockMvcResponse retire(String assetTag) {
    Long assetId = context.getId("ativoId_" + assetTag);
    MockMvcResponse response = apiClient.aposentarAtivo(assetId, context.getToken());
    context.setLastResponse(response);
    context.setValue("ativoTagAtual", assetTag);
    return response;
  }

  public MockMvcResponse startMaintenance(String assetTag, String reason) {
    Long assetId = context.getId("ativoId_" + assetTag);
    MockMvcResponse response = apiClient.solicitarManutencao(assetId, reason, context.getToken());
    context.setLastResponse(response);
    context.setValue("ativoTagAtual", assetTag);
    return response;
  }

  public MockMvcResponse transferToExtraUnit(String assetTag, String reason) {
    Long assetId = context.getId("ativoId_" + assetTag);
    Long toUnitId = context.getId("unidadeExtraId");
    MockMvcResponse response =
        apiClient.solicitarTransferencia(assetId, toUnitId, reason, context.getToken());
    context.setLastResponse(response);
    context.setValue("ativoTagAtual", assetTag);
    return response;
  }
}
