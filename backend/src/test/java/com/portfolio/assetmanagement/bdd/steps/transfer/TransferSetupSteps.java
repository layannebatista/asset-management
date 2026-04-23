package com.portfolio.assetmanagement.bdd.steps.transfer;

import com.portfolio.assetmanagement.bdd.context.ScenarioContext;
import com.portfolio.assetmanagement.bdd.support.TestDataHelper;
import com.portfolio.assetmanagement.domain.asset.entity.Asset;
import com.portfolio.assetmanagement.domain.asset.enums.AssetType;
import com.portfolio.assetmanagement.domain.organization.entity.Organization;
import com.portfolio.assetmanagement.domain.unit.entity.Unit;
import com.portfolio.assetmanagement.infrastructure.persistence.organization.repository.OrganizationRepository;
import io.cucumber.java.pt.E;
import org.springframework.beans.factory.annotation.Autowired;

/** Steps de preparação de dados para cenários de transferência. */
public class TransferSetupSteps {

  @Autowired private ScenarioContext context;
  @Autowired private TestDataHelper testDataHelper;
  @Autowired private TransferStepsContext transferContext;
  @Autowired private OrganizationRepository organizationRepository;

  // =========================================================
  // CONTEXTO / DADOS DE APOIO
  // =========================================================

  @E("que existe uma unidade {string} como destino na mesma organização")
  public void queExisteUmaUnidadeComoDestinoNaMesmaOrganizacao(String nome) {
    Long organizacaoId = context.getId("organizacaoId");
    Organization organizacao =
        organizationRepository
            .findById(organizacaoId)
            .orElseThrow(
                () ->
                    new AssertionError(
                        "Organização não encontrada no contexto: " + organizacaoId));

    Unit unidadeDestino = testDataHelper.criarUnidade(nome, organizacao);
    transferContext.setUnidadeDestinoId(unidadeDestino.getId());
    context.setId("unidadeDestinoPrincipalId", unidadeDestino.getId());
    context.setId("unidadeDestinoId", unidadeDestino.getId());
  }

  @E("que existe uma unidade {string} como destino secundário na mesma organização")
  public void queExisteUmaUnidadeComoDestinoSecundarioNaMesmaOrganizacao(String nome) {
    Long organizacaoId = context.getId("organizacaoId");
    Organization organizacao =
        organizationRepository
            .findById(organizacaoId)
            .orElseThrow(
                () ->
                    new AssertionError(
                        "Organização não encontrada no contexto: " + organizacaoId));

    Unit unidadeDestino = testDataHelper.criarUnidade(nome, organizacao);
    context.setId("unidadeDestinoSecundariaId", unidadeDestino.getId());
  }

  @E("que a unidade de destino é a própria unidade de origem")
  public void queAUnidadeDeDestinoEAAPropriaUnidadeDeOrigem() {
    Long unidadeOrigemId = context.getId("unidadeId");
    transferContext.setUnidadeDestinoId(unidadeOrigemId);
    context.setId("unidadeDestinoId", unidadeOrigemId);
  }

  @E("que a unidade de destino atual é a unidade principal")
  public void queAUnidadeDeDestinoAtualEUnidadePrincipal() {
    Long unidadeDestinoPrincipalId = context.getId("unidadeDestinoPrincipalId");
    transferContext.setUnidadeDestinoId(unidadeDestinoPrincipalId);
    context.setId("unidadeDestinoId", unidadeDestinoPrincipalId);
  }

  @E("que a unidade de destino atual é a unidade secundária")
  public void queAUnidadeDeDestinoAtualEUnidadeSecundaria() {
    Long unidadeDestinoSecundariaId = context.getId("unidadeDestinoSecundariaId");
    transferContext.setUnidadeDestinoId(unidadeDestinoSecundariaId);
    context.setId("unidadeDestinoId", unidadeDestinoSecundariaId);
  }

  @E("que existe um usuário GESTOR com email {string} e senha {string} na unidade de destino")
  public void queExisteGestorNaUnidadeDeDestino(String email, String senha) {
    Organization org =
        organizationRepository
            .findById(context.getId("organizacaoId"))
            .orElseThrow(
                () ->
                    new AssertionError(
                        "Organização não encontrada no contexto: " + context.getId("organizacaoId")));
    Long unidadeDestinoId = context.getId("unidadeDestinoId");
    Unit unidadeDestino = testDataHelper.obterUnidade(unidadeDestinoId);
    testDataHelper.criarGestor(email, senha, org, unidadeDestino);
  }

  @E("que existe um ativo {string} disponível na unidade de destino")
  public void queExisteUmAtivoDisponivelNaUnidadeDeDestino(String assetTag) {
    Organization org =
        organizationRepository
            .findById(context.getId("organizacaoId"))
            .orElseThrow(
                () ->
                    new AssertionError(
                        "Organização não encontrada no contexto: " + context.getId("organizacaoId")));
    Long unidadeDestinoId = context.getId("unidadeDestinoId");
    Unit unidadeDestino = testDataHelper.obterUnidade(unidadeDestinoId);
    Asset ativo = testDataHelper.criarAtivo(assetTag, AssetType.NOTEBOOK, org, unidadeDestino);
    context.setId("ativoId_" + assetTag, ativo.getId());
  }

  @E("que existe um ativo {string} disponível em outra unidade dessa organização")
  public void queExisteAtivoDisponivelEmOutraUnidadeDaOrganizacao(String assetTag) {
    Long organizacaoId = context.getId("organizacaoId");
    Organization organizacao =
        organizationRepository
            .findById(organizacaoId)
            .orElseThrow(
                () ->
                    new AssertionError(
                        "Organização não encontrada no contexto: " + organizacaoId));

    Unit unidadeOrigem = testDataHelper.obterUnidade(context.getId("unidadeId"));
    Unit outraUnidade = testDataHelper.criarUnidade("Unidade Externa Escopo", organizacao);

    if (outraUnidade.getId().equals(unidadeOrigem.getId())) {
      throw new AssertionError("Unidade de outra origem não pode ser igual à unidade do gestor");
    }

    Asset ativo = testDataHelper.criarAtivo(assetTag, AssetType.NOTEBOOK, organizacao, outraUnidade);
    context.setId("ativoId_" + assetTag, ativo.getId());
  }
}
