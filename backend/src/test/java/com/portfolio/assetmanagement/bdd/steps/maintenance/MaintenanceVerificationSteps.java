package com.portfolio.assetmanagement.bdd.steps.maintenance;

import static org.assertj.core.api.Assertions.assertThat;

import com.portfolio.assetmanagement.bdd.client.ApiClient;
import com.portfolio.assetmanagement.bdd.context.ScenarioContext;
import com.portfolio.assetmanagement.bdd.support.TestDataHelper;
import com.portfolio.assetmanagement.domain.asset.entity.Asset;
import com.portfolio.assetmanagement.infrastructure.persistence.asset.repository.AssetRepository;
import io.cucumber.java.pt.E;
import io.cucumber.java.pt.Então;
import io.cucumber.java.pt.Quando;
import io.restassured.module.mockmvc.response.MockMvcResponse;
import org.springframework.beans.factory.annotation.Autowired;

/** Steps de verificações e assertions para manutenção. */
public class MaintenanceVerificationSteps {

  @Autowired private ScenarioContext context;
  @Autowired private TestDataHelper testDataHelper;
  @Autowired private AssetRepository assetRepository;
  @Autowired private MaintenanceStepsContext mainContext;
  @Autowired private ApiClient apiClient;

  // =========================================================
  // VERIFICAÇÕES — STATUS HTTP
  // =========================================================

  @Então("a resposta deve ter status {int}")
  public void aRespostaDeveTerStatus(int statusEsperado) {
    assertThat(context.getLastResponse().statusCode())
        .as("Status HTTP incorreto. Body: %s", context.getLastResponse().getBody().asString())
        .isEqualTo(statusEsperado);
  }

  // =========================================================
  // VERIFICAÇÕES — STATUS DE MANUTENÇÃO
  // =========================================================

  @E("o status da manutenção deve ser {string}")
  public void oStatusDaManutencaoDeveSer(String statusEsperado) {
    String statusAtual = context.getLastResponse().path("status");
    assertThat(statusAtual).as("Status da manutenção incorreto").isEqualTo(statusEsperado);
  }

  // =========================================================
  // VERIFICAÇÕES — MENSAGENS DE ERRO
  // =========================================================

  @E("a mensagem de erro deve conter {string}")
  public void aMensagemDeErroDeveConter(String textoEsperado) {
    String body = context.getLastResponse().getBody().asString();
    assertThat(body)
        .as("Mensagem de erro não contém o texto esperado '%s'", textoEsperado)
        .containsIgnoringCase(textoEsperado);
  }

  // =========================================================
  // VERIFICAÇÕES — ID
  // =========================================================

  @E("salvo o ID da manutenção criada")
  public void salvoOIdDaManutencaoCriada() {
    Number raw = context.getLastResponse().path("id");
    assertThat(raw).as("ID da manutenção não encontrado na resposta").isNotNull();
    mainContext.setManutencaoId(raw.longValue());
    context.setLastCreatedId(raw.longValue());
  }

  // =========================================================
  // VERIFICAÇÕES — STATUS DO ATIVO
  // =========================================================

  @E("o ativo {string} deve ter status {string}")
  public void oAtivoDeveTerStatus(String assetTag, String statusEsperado) {
    Long assetId = context.getId("ativoId_" + assetTag);
    Asset ativo =
        assetRepository
            .findById(assetId)
            .orElseThrow(() -> new AssertionError("Ativo não encontrado no banco: " + assetTag));

    assertThat(ativo.getStatus().name())
        .as("Status do ativo '%s' incorreto", assetTag)
        .isEqualTo(statusEsperado);
  }

  // =========================================================
  // CONSULTAS / LISTAGEM
  // =========================================================

  @Quando("listo as manutenções do ativo {string}")
  public void listoAsManutencoesDoAtivo(String assetTag) {
    Long assetId = context.getId("ativoId_" + assetTag);
    MockMvcResponse response =
        apiClient.listMaintenancesByAssetWithToken(assetId, context.getToken());
    context.setLastResponse(response);
  }

  @E("a resposta deve conter at least {int} manutenções")
  public void aRespostaDeveConterAtLeastManutencoes(int quantidade) {
    Integer tamanho = context.getLastResponse().path("content.size()");
    assertThat(tamanho).as("Quantidade de manutenções esperada").isGreaterThanOrEqualTo(quantidade);
  }
}
