package com.portfolio.assetmanagement.bdd.steps.maintenance;

import static org.assertj.core.api.Assertions.assertThat;

import com.portfolio.assetmanagement.bdd.client.ApiClient;
import com.portfolio.assetmanagement.bdd.context.ScenarioContext;
import com.portfolio.assetmanagement.bdd.support.TestDataHelper;
import com.portfolio.assetmanagement.domain.asset.entity.Asset;
import com.portfolio.assetmanagement.domain.asset.enums.AssetStatus;
import com.portfolio.assetmanagement.domain.asset.enums.AssetType;
import com.portfolio.assetmanagement.domain.organization.entity.Organization;
import com.portfolio.assetmanagement.domain.unit.entity.Unit;
import io.cucumber.java.pt.Dado;
import io.cucumber.java.pt.E;
import io.restassured.module.mockmvc.response.MockMvcResponse;
import org.springframework.beans.factory.annotation.Autowired;

/** Steps de preparação de dados (Dado/E) para cenários de manutenção. */
public class MaintenanceSetupSteps {

  @Autowired private ScenarioContext context;
  @Autowired private TestDataHelper testDataHelper;
  @Autowired private MaintenanceStepsContext mainContext;
  @Autowired private ApiClient apiClient;

  // =========================================================
  // CONTEXTO / DADOS DE APOIO
  // =========================================================

  @Dado("que existe uma organização {string} cadastrada")
  public void queExisteUmaOrganizacao(String nome) {
    Organization org = testDataHelper.criarOrganizacao(nome);
    mainContext.setOrganizacaoId(org.getId());
    context.setId("organizacaoId", org.getId());
  }

  @E("que existe uma unidade {string} nessa organização")
  public void queExisteUmaUnidade(String nome) {
    Organization org = testDataHelper.obterOrganizacao(mainContext.getOrganizacaoId());
    Unit unit = testDataHelper.criarUnidade(nome, org);
    mainContext.setUnidadeId(unit.getId());
    context.setId("unidadeId", unit.getId());
  }

  @E("que existe um ativo {string} disponível nessa unidade")
  public void queExisteUmAtivoDisponivel(String assetTag) {
    Organization org = testDataHelper.obterOrganizacao(mainContext.getOrganizacaoId());
    Unit unit = testDataHelper.obterUnidade(mainContext.getUnidadeId());
    Asset ativo =
        testDataHelper.criarAtivo(assetTag, AssetType.NOTEBOOK, org, unit);
    mainContext.setAtivoTagAtual(assetTag);
    context.setId("ativoId_" + assetTag, ativo.getId());
  }

  @E("que existe um usuário ADMIN com email {string} e senha {string}")
  public void queExisteAdmin(String email, String senha) {
    Organization org = testDataHelper.obterOrganizacao(mainContext.getOrganizacaoId());
    Unit unit = testDataHelper.obterUnidade(mainContext.getUnidadeId());
    testDataHelper.criarAdmin(email, senha, org, unit);
  }

  @E("que existe um usuário GESTOR com email {string} e senha {string}")
  public void queExisteGestor(String email, String senha) {
    Organization org = testDataHelper.obterOrganizacao(mainContext.getOrganizacaoId());
    Unit unit = testDataHelper.obterUnidade(mainContext.getUnidadeId());
    testDataHelper.criarGestor(email, senha, org, unit);
  }

  @E("que existe um usuário OPERADOR com email {string} e senha {string}")
  public void queExisteOperador(String email, String senha) {
    Organization org = testDataHelper.obterOrganizacao(mainContext.getOrganizacaoId());
    Unit unit = testDataHelper.obterUnidade(mainContext.getUnidadeId());
    testDataHelper.criarOperador(email, senha, org, unit);
  }

  @E("que existe um ativo {string} em manutenção nessa unidade")
  public void queExisteAtivoEmManutencao(String assetTag) {
    Organization org = testDataHelper.obterOrganizacao(mainContext.getOrganizacaoId());
    Unit unit = testDataHelper.obterUnidade(mainContext.getUnidadeId());
    Asset ativo =
        testDataHelper.criarAtivoComStatus(
            assetTag, AssetType.NOTEBOOK, "Modelo Em Manutenção", org, unit, AssetStatus.IN_MAINTENANCE);
    mainContext.setAtivoTagAtual(assetTag);
    context.setId("ativoId_" + assetTag, ativo.getId());
  }

  @E("que existe um ativo {string} aposentado nessa unidade")
  public void queExisteAtivoAposentado(String assetTag) {
    Organization org = testDataHelper.obterOrganizacao(mainContext.getOrganizacaoId());
    Unit unit = testDataHelper.obterUnidade(mainContext.getUnidadeId());
    Asset ativo =
        testDataHelper.criarAtivoComStatus(
            assetTag, AssetType.NOTEBOOK, "Modelo Aposentado", org, unit, AssetStatus.RETIRED);
    mainContext.setAtivoTagAtual(assetTag);
    context.setId("ativoId_" + assetTag, ativo.getId());
  }

  @E("que existe um ativo {string} em transferência nessa unidade")
  public void queExisteAtivoEmTransferencia(String assetTag) {
    Organization org = testDataHelper.obterOrganizacao(mainContext.getOrganizacaoId());
    Unit unit = testDataHelper.obterUnidade(mainContext.getUnidadeId());
    Asset ativo =
        testDataHelper.criarAtivoComStatus(
            assetTag, AssetType.NOTEBOOK, "Modelo Em Transferência", org, unit, AssetStatus.IN_TRANSFER);
    mainContext.setAtivoTagAtual(assetTag);
    context.setId("ativoId_" + assetTag, ativo.getId());
  }

  @E("que estou autenticado como {string} com senha {string}")
  public void queEstouAutenticado(String email, String senha) {
    MockMvcResponse response = apiClient.login(email, senha);
    
    assertThat(response.statusCode())
        .as("Login falhou para o usuário %s", email)
        .isEqualTo(200);

    String token = response.path("accessToken");
    context.setToken(token);
  }
}
