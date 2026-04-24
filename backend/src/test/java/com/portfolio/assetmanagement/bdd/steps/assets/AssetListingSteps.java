package com.portfolio.assetmanagement.bdd.steps.assets;

import static org.assertj.core.api.Assertions.assertThat;

import com.portfolio.assetmanagement.bdd.client.ApiClient;
import com.portfolio.assetmanagement.bdd.context.ScenarioContext;
import io.cucumber.java.pt.E;
import io.cucumber.java.pt.Então;
import io.cucumber.java.pt.Quando;
import io.restassured.module.mockmvc.response.MockMvcResponse;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;

/** Steps de listagem e busca de ativos. */
public class AssetListingSteps {

  @Autowired private ApiClient apiClient;
  @Autowired private ScenarioContext context;

  // =========================================================
  // AÇÕES DE BUSCA
  // =========================================================

  @Quando("listo os ativos")
  public void listoOsAtivos() {
    context.setLastResponse(apiClient.listarAtivos(context.getToken()));
  }

  @Quando("listo os ativos sem autenticação")
  public void listoOsAtivosSemAutenticacao() {
    context.setLastResponse(apiClient.getSemToken("/assets"));
  }

  @Quando("busco um ativo por id sem autenticação")
  public void buscoUmAtivoPorIdSemAutenticacao() {
    context.setLastResponse(apiClient.getSemToken("/assets/1"));
  }

  @Quando("busco o ativo com id {long}")
  public void buscoOAtivoComId(Long id) {
    context.setLastResponse(apiClient.buscarAtivo(id, context.getToken()));
  }

  @Quando("listo os ativos filtrando por status {string}")
  public void listoOsAtivosFiltrandoPorStatus(String status) {
    context.setLastResponse(apiClient.listarAtivosPorStatus(status, context.getToken()));
  }

  @Quando("listo os ativos filtrando por assetTag {string}")
  public void listoOsAtivosFiltrandoPorAssetTag(String assetTag) {
    context.setLastResponse(apiClient.listarAtivosPorAssetTag(assetTag, context.getToken()));
  }

  // =========================================================
  // VERIFICAÇÕES
  // =========================================================

  @E("a listagem deve conter ativos com assetTag preenchido")
  public void aListagemDeveConterAtivosComAssetTagPreenchido() {
    MockMvcResponse response = context.getLastResponse();
    assertThat(response.statusCode())
        .as("Status da listagem deveria ser 200. Body: %s", response.getBody().asString())
        .isEqualTo(200);

    String assetTag = response.path("content[0].assetTag");
    assertThat(assetTag)
        .as("Campo 'assetTag' não encontrado em content[0]. Body: %s", response.getBody().asString())
        .isNotBlank();
  }

  @Então("o ativo {string} não deve estar na listagem")
  public void ativoNaoNaListagem(String assetTag) {
    Object contentObject = context.getLastResponse().path("content");
    String content = String.valueOf(contentObject);
    assertThat(content).as("Ativo não deveria estar na listagem filtrada").doesNotContain(assetTag);
  }

  @Então("o ativo {string} deve estar na listagem")
  public void ativoDeveEstarNaListagem(String assetTag) {
    Object contentObject = context.getLastResponse().path("content");
    String content = String.valueOf(contentObject);
    assertThat(content).as("Ativo deveria estar na listagem filtrada").contains(assetTag);
  }

  @E("quando listo filtrando por status {string}, deve estar presente")
  public void quandoListoFiltrandoDeveEstarPresente(String status) {
    MockMvcResponse response = apiClient.listarAtivosPorStatus(status, context.getToken());
    assertThat(response.statusCode()).isEqualTo(200);
    context.setLastResponse(response);
    String currentTag = context.getCurrentAssetTag();
    if (currentTag != null) {
      Object contentObject = response.path("content");
      String content = String.valueOf(contentObject);
      assertThat(content).contains(currentTag);
    }
  }

  @Quando("busco o ativo {string} por ID")
  public void buscoOAtivoPorTag(String assetTag) {
    Long assetId = context.getId("ativoId_" + assetTag);
    context.setLastResponse(apiClient.buscarAtivo(assetId, context.getToken()));
  }

  @Quando("listo os ativos filtrando por tipo {string}")
  public void listoOsAtivosFiltrandoPorTipo(String tipo) {
    context.setLastResponse(apiClient.listarAtivosPorTipo(tipo, context.getToken()));
  }

  @Quando("listo o histórico de status do ativo {string}")
  public void listaOHistoricoDeStatusDoAtivo(String assetTag) {
    Long assetId = context.getId("ativoId_" + assetTag);
    context.setLastResponse(apiClient.buscarHistoricoStatus(assetId, context.getToken()));
  }

  @Quando("listo o histórico de atribuições do ativo {string}")
  public void listaOHistoricoDeAtribuicoesDoAtivo(String assetTag) {
    Long assetId = context.getId("ativoId_" + assetTag);
    context.setLastResponse(apiClient.buscarHistoricoAtribuicoes(assetId, context.getToken()));
  }

  @Então("o histórico deve conter pelo menos um registro")
  public void oHistoricoDeveConterPeloMenosUmRegistro() {
    List<?> lista = context.getLastResponse().path("");
    if (lista == null) {
      lista = context.getLastResponse().path("content");
    }
    assertThat(lista).as("Histórico não deve estar vazio").isNotEmpty();
  }
}
