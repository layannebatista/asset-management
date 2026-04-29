package com.portfolio.assetmanagement.bdd.steps.assets;

import static org.assertj.core.api.Assertions.assertThat;

import com.portfolio.assetmanagement.bdd.client.ApiClient;
import com.portfolio.assetmanagement.bdd.context.ScenarioContext;
import com.portfolio.assetmanagement.domain.asset.enums.AssetType;
import io.cucumber.java.pt.Então;
import io.cucumber.java.pt.Quando;
import org.springframework.beans.factory.annotation.Autowired;

/** Steps de criação de ativos, incluindo validações de campo. */
public class AssetCreationSteps {

  @Autowired private ApiClient apiClient;
  @Autowired private ScenarioContext context;

  // =========================================================
  // AÇÕES DE CRIAÇÃO
  // =========================================================

  @Quando("crio um ativo com dados inválidos na organização")
  public void crioUmAtivoComDadosInvalidosNaOrganizacao() {
    Long orgId = context.getId("organizacaoId");
    context.setLastResponse(apiClient.criarAtivoComDadosInvalidos(orgId, context.getToken()));
  }

  @Quando("crio um ativo como operador na organização")
  public void crioUmAtivoComoOperadorNaOrganizacao() {
    Long orgId = context.getId("organizacaoId");
    Long unitId = context.getId("unidadeId");
    context.setLastResponse(
        apiClient.criarAtivo(
            orgId,
            "ASSET-OP-TEST",
            AssetType.NOTEBOOK,
            "Modelo Operador",
            unitId,
            context.getToken()));
  }

  @Quando("crio um ativo {string} do tipo {string} modelo {string} na organização")
  public void crioUmAtivo(String assetTag, String tipo, String modelo) {
    Long orgId = context.getId("organizacaoId");
    Long unitId = context.getId("unidadeId");
    context.setLastResponse(
        apiClient.criarAtivo(
            orgId, assetTag, AssetType.valueOf(tipo), modelo, unitId, context.getToken()));
    context.setValue("ativoTagAtual", assetTag);
  }

  @Quando("crio um ativo com assetTag de {int} caracteres na organização")
  public void crioUmAtivoComAssetTagDeComprimento(int comprimento) {
    Long orgId = context.getId("organizacaoId");
    Long unitId = context.getId("unidadeId");
    String assetTag = "A".repeat(comprimento);
    context.setLastResponse(
        apiClient.criarAtivo(
            orgId, assetTag, AssetType.NOTEBOOK, "Modelo Boundary", unitId, context.getToken()));
    context.setValue("ativoTagAtual", assetTag);
  }

  @Quando("crio um ativo com assetTag apenas espaços na organização")
  public void crioUmAtivoComAssetTagApenasEspacos() {
    Long orgId = context.getId("organizacaoId");
    Long unitId = context.getId("unidadeId");
    context.setLastResponse(
        apiClient.criarAtivoComAssetTagBranco(orgId, unitId, context.getToken()));
  }

  @Quando("crio um ativo sem assetTag na organização")
  public void crioUmAtivoSemAssetTag() {
    Long orgId = context.getId("organizacaoId");
    Long unitId = context.getId("unidadeId");
    context.setLastResponse(apiClient.criarAtivoSemAssetTag(orgId, unitId, context.getToken()));
  }

  @Quando("crio um ativo sem type na organização")
  public void crioUmAtivoSemType() {
    Long orgId = context.getId("organizacaoId");
    Long unitId = context.getId("unidadeId");
    context.setLastResponse(
        apiClient.criarAtivoSemType(orgId, "ASSET-SEMTYPE", unitId, context.getToken()));
  }

  @Quando("crio um ativo {string} do tipo {string} modelo {string} na unidade extra")
  public void crioUmAtivoNaUnidadeExtra(String assetTag, String tipo, String modelo) {
    Long orgId = context.getId("organizacaoId");
    Long unitId = context.getId("unidadeExtraId");
    context.setLastResponse(
        apiClient.criarAtivo(
            orgId, assetTag, AssetType.valueOf(tipo), modelo, unitId, context.getToken()));
    context.setValue("ativoTagAtual", assetTag);
  }

  // =========================================================
  // VERIFICAÇÕES
  // =========================================================

  @Então("o ativo criado deve ter assetTag {string}")
  public void oAtivoCriadoDeveTerAssetTag(String assetTagEsperado) {
    assertThat((String) context.getLastResponse().path("assetTag"))
        .as("AssetTag incorreto na resposta de criação")
        .isEqualTo(assetTagEsperado);
  }

  @Quando("crio um ativo com assetTag automática na organização")
  public void crioUmAtivoComAssetTagAutomatica() {
    Long orgId = context.getId("organizacaoId");
    Long unitId = context.getId("unidadeId");
    context.setLastResponse(
        apiClient.criarAtivoAutoTag(
            orgId, AssetType.NOTEBOOK, "Modelo Auto", unitId, context.getToken()));
  }

  @Quando("crio um ativo sem modelo na organização")
  public void crioUmAtivoSemModelo() {
    Long orgId = context.getId("organizacaoId");
    Long unitId = context.getId("unidadeId");
    context.setLastResponse(
        apiClient.criarAtivoSemModelo(orgId, "ASSET-SEMMODELO", unitId, context.getToken()));
  }

  @Então("o ativo criado deve ter assetTag preenchida automaticamente")
  public void oAtivoCriadoDeveTermAssetTagGerada() {
    assertThat((String) context.getLastResponse().path("assetTag"))
        .as("AssetTag gerada automaticamente não deve ser vazia")
        .isNotBlank();
  }
}
