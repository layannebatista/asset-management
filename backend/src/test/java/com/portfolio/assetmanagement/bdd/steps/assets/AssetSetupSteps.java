package com.portfolio.assetmanagement.bdd.steps.assets;

import com.portfolio.assetmanagement.bdd.context.ScenarioContext;
import com.portfolio.assetmanagement.bdd.support.TestDataHelper;
import com.portfolio.assetmanagement.domain.asset.entity.Asset;
import com.portfolio.assetmanagement.domain.asset.enums.AssetStatus;
import com.portfolio.assetmanagement.domain.asset.enums.AssetType;
import com.portfolio.assetmanagement.domain.organization.entity.Organization;
import com.portfolio.assetmanagement.domain.unit.entity.Unit;
import com.portfolio.assetmanagement.domain.user.entity.User;
import io.cucumber.java.pt.Dado;
import io.cucumber.java.pt.E;
import org.springframework.beans.factory.annotation.Autowired;

/** Steps de preparação de dados (Dado/E) para cenários de ativo. */
public class AssetSetupSteps {

  @Autowired private ScenarioContext context;
  @Autowired private TestDataHelper testDataHelper;

  // =========================================================
  // ATIVO COM STATUS
  // =========================================================

  @E("que existe um ativo {string} atribuído nessa unidade")
  public void queExisteUmAtivoAtribuido(String assetTag) {
    Long orgId = context.getId("organizacaoId");
    Long unitId = context.getId("unidadeId");
    Asset saved =
        testDataHelper.criarAtivoComQualquerUsuarioDaOrganizacao(
            assetTag, AssetType.NOTEBOOK, "Modelo Atribuído", orgId, unitId);
    context.setId("ativoId_" + assetTag, saved.getId());
    context.setValue("ativoTagAtual", assetTag);
  }

  @E("que existe um ativo {string} com usuário atribuído nessa unidade")
  public void queExisteUmAtivoComUsuarioAtribuido(String assetTag) {
    Long orgId = context.getId("organizacaoId");
    Long unitId = context.getId("unidadeId");
    Asset saved =
        testDataHelper.criarAtivoComQualquerUsuarioDaOrganizacao(
            assetTag, AssetType.NOTEBOOK, "Modelo Com Usuário", orgId, unitId);
    context.setId("ativoId_" + assetTag, saved.getId());
    context.setValue("ativoTagAtual", assetTag);
  }

  @E("que existe um usuário OPERADOR adicional com email {string} e senha {string}")
  public void queExisteOperadorAdicional(String email, String senha) {
    Long orgId = context.getId("organizacaoId");
    Long unitId = context.getId("unidadeId");
    Organization org = testDataHelper.obterOrganizacao(orgId);
    Unit unit = testDataHelper.obterUnidade(unitId);
    User user = testDataHelper.criarOperador(email, senha, org, unit);
    context.setId("usuarioId_" + email, user.getId());
  }

  @E("que existe um ativo {string} atribuído ao usuário {string} nessa unidade")
  public void queExisteAtivoAtribuidoAoUsuarioNaUnidade(String assetTag, String email) {
    Long orgId = context.getId("organizacaoId");
    Long unitId = context.getId("unidadeId");
    Asset saved =
        testDataHelper.criarAtivoComUsuarioAtribuido(
            assetTag, AssetType.NOTEBOOK, "Modelo Atribuído Usuário", orgId, unitId, email);
    context.setId("ativoId_" + assetTag, saved.getId());
    context.setValue("ativoTagAtual", assetTag);
  }

  // =========================================================
  // UNIDADES EXTRAS
  // =========================================================

  @E("que existe uma unidade {string} nessa organização como unidade extra")
  public void queExisteUmaUnidadeExtra(String nome) {
    Long orgId = context.getId("organizacaoId");
    Unit extraUnit = testDataHelper.criarUnidadePorOrganizacaoId(nome, orgId);
    context.setId("unidadeExtraId", extraUnit.getId());
  }

  @E("que existe uma unidade {string} nessa organização como unidade extra 2")
  public void queExisteUmaUnidadeExtra2(String nome) {
    Long orgId = context.getId("organizacaoId");
    Unit extraUnit = testDataHelper.criarUnidadePorOrganizacaoId(nome, orgId);
    context.setId("unidadeExtraId2", extraUnit.getId());
  }

  @E("que existe um ativo {string} disponível na unidade extra")
  public void queExisteAtivoDisponivelNaUnidadeExtra(String assetTag) {
    Long orgId = context.getId("organizacaoId");
    Long unitId = context.getId("unidadeExtraId");
    Asset saved =
        testDataHelper.criarAtivoComStatus(
            assetTag,
            AssetType.NOTEBOOK,
            "Modelo em outra unidade",
            orgId,
            unitId,
            AssetStatus.AVAILABLE);
    context.setId("ativoId_" + assetTag, saved.getId());
    context.setValue("ativoTagAtual", assetTag);
  }

  // =========================================================
  // ORGANIZAÇÃO SECUNDÁRIA (cenários de segurança/IDOR)
  // =========================================================

  @E("que existe uma organização secundária {string} cadastrada")
  public void queExisteUmaOrganizacaoSecundaria(String nome) {
    Organization org = testDataHelper.criarOrganizacao(nome);
    context.setId("organizacaoSecundariaId", org.getId());
  }

  @E("que existe uma unidade {string} na organização secundária")
  public void queExisteUnidadeNaOrganizacaoSecundaria(String nome) {
    Long orgId = context.getId("organizacaoSecundariaId");
    Unit unit = testDataHelper.criarUnidadePorOrganizacaoId(nome, orgId);
    context.setId("unidadeSecundariaId", unit.getId());
  }

  @E("que existe um usuário ADMIN da organização secundária com email {string} e senha {string}")
  public void queExisteAdminDaOrganizacaoSecundaria(String email, String senha) {
    Organization org = testDataHelper.obterOrganizacao(context.getId("organizacaoSecundariaId"));
    Unit unit = testDataHelper.obterUnidade(context.getId("unidadeSecundariaId"));
    User admin = testDataHelper.criarAdmin(email, senha, org, unit);
    context.setId("usuarioId_" + email, admin.getId());
  }

  @E("que existe um ativo {string} disponível na organização secundária")
  public void queExisteAtivoDisponivelNaOrganizacaoSecundaria(String assetTag) {
    Long orgId = context.getId("organizacaoSecundariaId");
    Long unitId = context.getId("unidadeSecundariaId");
    Asset saved =
        testDataHelper.criarAtivoComStatus(
            assetTag, AssetType.NOTEBOOK, "Modelo Outra Org", orgId, unitId, AssetStatus.AVAILABLE);
    context.setId("ativoId_" + assetTag, saved.getId());
    context.setValue("ativoTagAtual", assetTag);
  }
}
