package com.portfolio.assetmanagement.bdd.steps;

import static org.assertj.core.api.Assertions.assertThat;

import com.portfolio.assetmanagement.bdd.client.ApiClient;
import com.portfolio.assetmanagement.bdd.context.ScenarioContext;
import com.portfolio.assetmanagement.bdd.support.TestDataHelper;
import com.portfolio.assetmanagement.domain.asset.entity.Asset;
import com.portfolio.assetmanagement.domain.asset.enums.AssetStatus;
import com.portfolio.assetmanagement.domain.asset.enums.AssetType;
import com.portfolio.assetmanagement.domain.organization.entity.Organization;
import com.portfolio.assetmanagement.domain.unit.entity.Unit;
import com.portfolio.assetmanagement.infrastructure.persistence.organization.repository.OrganizationRepository;
import com.portfolio.assetmanagement.infrastructure.persistence.unit.repository.UnitRepository;
import com.portfolio.assetmanagement.infrastructure.persistence.asset.repository.AssetRepository;
import com.portfolio.assetmanagement.infrastructure.persistence.user.repository.UserRepository;
import com.portfolio.assetmanagement.security.enums.UserRole;
import io.cucumber.java.pt.Dado;
import io.cucumber.java.pt.E;
import io.cucumber.java.pt.Então;
import io.cucumber.java.pt.Quando;
import io.restassured.module.mockmvc.response.MockMvcResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * CAMADA 3 — Step Definitions para a feature de Ativos.
 *
 * <p>Reutiliza os passos de contexto definidos em MaintenanceSteps (organização, unidade,
 * usuários, ativo, autenticação) e define apenas os passos específicos ao domínio de ativos.
 *
 * <p>Os IDs de organização, unidade e ativo são disponibilizados via ScenarioContext,
 * populados pelos passos de Contexto em MaintenanceSteps:
 * - context.getId("organizacaoId")
 * - context.getId("unidadeId")
 * - context.getId("ativoId_" + assetTag)
 */
public class AssetSteps {

  @Autowired private ApiClient apiClient;
  @Autowired private ScenarioContext context;
  @Autowired private TestDataHelper testDataHelper;
  @Autowired private OrganizationRepository organizationRepository;
  @Autowired private UnitRepository unitRepository;
  @Autowired private AssetRepository assetRepository;
  @Autowired private UserRepository userRepository;
  @Autowired private PasswordEncoder passwordEncoder;

  // =========================================================
  // SETUP — dados adicionais do cenário
  // =========================================================

  @E("que existe um ativo {string} atribuído nessa unidade")
  public void queExisteUmAtivoAtribuido(String assetTag) {
    Long orgId = context.getId("organizacaoId");
    Long unitId = context.getId("unidadeId");
    Organization org = organizationRepository.findById(orgId)
        .orElseThrow(() -> new AssertionError("Organização não encontrada: " + orgId));
    Unit unit = unitRepository.findById(unitId)
        .orElseThrow(() -> new AssertionError("Unidade não encontrada: " + unitId));
    Asset asset = new Asset(assetTag, AssetType.NOTEBOOK, "Modelo Atribuído", org, unit);
    asset.changeStatus(AssetStatus.ASSIGNED);
    Asset saved = assetRepository.save(asset);
    context.setId("ativoId_" + assetTag, saved.getId());
  }

  /**
   * Cria ativo com usuário OPERADOR efetivamente atribuído (assignedUser != null).
   * Necessário para testar "assign de ativo já ASSIGNED → 400".
   */
  @E("que existe um ativo {string} com usuário atribuído nessa unidade")
  public void queExisteUmAtivoComUsuarioAtribuido(String assetTag) {
    Long orgId = context.getId("organizacaoId");
    Long unitId = context.getId("unidadeId");
    Organization org = organizationRepository.findById(orgId)
        .orElseThrow(() -> new AssertionError("Organização não encontrada: " + orgId));
    Unit unit = unitRepository.findById(unitId)
        .orElseThrow(() -> new AssertionError("Unidade não encontrada: " + unitId));
    Asset asset = new Asset(assetTag, AssetType.NOTEBOOK, "Modelo Com Usuário", org, unit);
    // Busca qualquer usuário da organização para atribuir
    userRepository.findAll().stream()
        .filter(u -> u.getOrganization() != null && u.getOrganization().getId().equals(orgId))
        .findFirst()
        .ifPresent(asset::assignToUser);
    Asset saved = assetRepository.save(asset);
    context.setId("ativoId_" + assetTag, saved.getId());
  }

  @E("que existe uma unidade {string} nessa organização como unidade extra")
  public void queExisteUmaUnidadeExtra(String nome) {
    Long orgId = context.getId("organizacaoId");
    Organization org = organizationRepository.findById(orgId)
        .orElseThrow(() -> new AssertionError("Organização não encontrada: " + orgId));
    Unit extraUnit = testDataHelper.criarUnidade(nome, org);
    context.setId("unidadeExtraId", extraUnit.getId());
  }

  @E("que existe um ativo {string} aposentado nessa unidade")
  public void queExisteUmAtivoAposentadoNessaUnidade(String assetTag) {
    Long orgId = context.getId("organizacaoId");
    Long unitId = context.getId("unidadeId");
    Organization org = organizationRepository.findById(orgId)
        .orElseThrow(() -> new AssertionError("Organização não encontrada: " + orgId));
    Unit unit = unitRepository.findById(unitId)
        .orElseThrow(() -> new AssertionError("Unidade não encontrada: " + unitId));
    Asset asset = new Asset(assetTag, AssetType.NOTEBOOK, "Modelo Aposentado", org, unit);
    asset.changeStatus(AssetStatus.RETIRED);
    Asset saved = assetRepository.save(asset);
    context.setId("ativoId_" + assetTag, saved.getId());
  }

  // =========================================================
  // LISTAGEM
  // =========================================================

  @Quando("listo os ativos")
  public void listoOsAtivos() {
    MockMvcResponse response = apiClient.listarAtivos(context.getToken());
    context.setLastResponse(response);
  }

  @Quando("listo os ativos sem autenticação")
  public void listoOsAtivosSemAutenticacao() {
    MockMvcResponse response = apiClient.getSemToken("/assets");
    context.setLastResponse(response);
  }

  @Quando("busco um ativo por id sem autenticação")
  public void buscoUmAtivoPorIdSemAutenticacao() {
    MockMvcResponse response = apiClient.getSemToken("/assets/1");
    context.setLastResponse(response);
  }

  @Quando("busco o ativo com id {long}")
  public void buscoOAtivoComId(Long id) {
    MockMvcResponse response = apiClient.buscarAtivo(id, context.getToken());
    context.setLastResponse(response);
  }

  @Quando("listo os ativos filtrando por status {string}")
  public void listoOsAtivosFiltrandoPorStatus(String status) {
    MockMvcResponse response = apiClient.listarAtivosPorStatus(status, context.getToken());
    context.setLastResponse(response);
  }

  @Quando("listo os ativos filtrando por assetTag {string}")
  public void listoOsAtivosFiltrandoPorAssetTag(String assetTag) {
    MockMvcResponse response = apiClient.listarAtivosPorAssetTag(assetTag, context.getToken());
    context.setLastResponse(response);
  }

  // =========================================================
  // CRIAÇÃO
  // =========================================================

  @Quando("crio um ativo com dados inválidos na organização")
  public void crioUmAtivoComDadosInvalidosNaOrganizacao() {
    Long orgId = context.getId("organizacaoId");
    MockMvcResponse response = apiClient.criarAtivoComDadosInvalidos(orgId, context.getToken());
    context.setLastResponse(response);
  }

  @Quando("crio um ativo como operador na organização")
  public void crioUmAtivoComoOperadorNaOrganizacao() {
    Long orgId = context.getId("organizacaoId");
    Long unitId = context.getId("unidadeId");
    // Token do OPERADOR (já autenticado via passo "Dado que estou autenticado como...")
    MockMvcResponse response =
        apiClient.criarAtivo(
            orgId, "ASSET-OP-TEST", AssetType.NOTEBOOK, "Modelo Operador", unitId,
            context.getToken());
    context.setLastResponse(response);
  }

  @Quando("crio um ativo {string} do tipo {string} modelo {string} na organização")
  public void crioUmAtivo(String assetTag, String tipo, String modelo) {
    Long orgId = context.getId("organizacaoId");
    Long unitId = context.getId("unidadeId");
    AssetType type = AssetType.valueOf(tipo);
    MockMvcResponse response =
        apiClient.criarAtivo(orgId, assetTag, type, modelo, unitId, context.getToken());
    context.setLastResponse(response);
  }

  @Quando("crio um ativo com assetTag de {int} caracteres na organização")
  public void crioUmAtivoComAssetTagDeComprimento(int comprimento) {
    Long orgId = context.getId("organizacaoId");
    Long unitId = context.getId("unidadeId");
    String assetTag = "A".repeat(comprimento);
    MockMvcResponse response =
        apiClient.criarAtivo(orgId, assetTag, AssetType.NOTEBOOK, "Modelo Boundary", unitId, context.getToken());
    context.setLastResponse(response);
  }

  @Quando("crio um ativo com assetTag apenas espaços na organização")
  public void crioUmAtivoComAssetTagApenasEspacos() {
    Long orgId = context.getId("organizacaoId");
    Long unitId = context.getId("unidadeId");
    MockMvcResponse response =
        apiClient.criarAtivoComAssetTagBranco(orgId, unitId, context.getToken());
    context.setLastResponse(response);
  }

  @Quando("crio um ativo sem assetTag na organização")
  public void crioUmAtivoSemAssetTag() {
    Long orgId = context.getId("organizacaoId");
    Long unitId = context.getId("unidadeId");
    MockMvcResponse response = apiClient.criarAtivoSemAssetTag(orgId, unitId, context.getToken());
    context.setLastResponse(response);
  }

  @Quando("crio um ativo sem type na organização")
  public void crioUmAtivoSemType() {
    Long orgId = context.getId("organizacaoId");
    Long unitId = context.getId("unidadeId");
    MockMvcResponse response = apiClient.criarAtivoSemType(orgId, "ASSET-SEMTYPE", unitId, context.getToken());
    context.setLastResponse(response);
  }

  @Quando("crio um ativo {string} do tipo {string} modelo {string} na unidade extra")
  public void crioUmAtivoNaUnidadeExtra(String assetTag, String tipo, String modelo) {
    Long orgId = context.getId("organizacaoId");
    Long unitId = context.getId("unidadeExtraId");
    AssetType type = AssetType.valueOf(tipo);
    MockMvcResponse response =
        apiClient.criarAtivo(orgId, assetTag, type, modelo, unitId, context.getToken());
    context.setLastResponse(response);
  }

  // =========================================================
  // APOSENTADORIA
  // =========================================================

  @Quando("tento aposentar o ativo {string}")
  public void tentoAposentarOAtivo(String assetTag) {
    Long assetId = context.getId("ativoId_" + assetTag);
    MockMvcResponse response = apiClient.aposentarAtivo(assetId, context.getToken());
    context.setLastResponse(response);
  }

  // =========================================================
  // ATRIBUIÇÃO
  // =========================================================

  @Quando("tento atribuir o ativo {string} a outro usuário")
  public void tentoAtribuirOAtivoAOutroUsuario(String assetTag) {
    Long assetId = context.getId("ativoId_" + assetTag);
    // Qualquer userId — @PreAuthorize bloqueia antes da validação de dados
    MockMvcResponse response = apiClient.atribuirAtivo(assetId, 1L, context.getToken());
    context.setLastResponse(response);
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
        .as(
            "Campo 'assetTag' não encontrado em content[0]. Body: %s",
            response.getBody().asString())
        .isNotBlank();
  }

  @Então("o ativo criado deve ter assetTag {string}")
  public void oAtivoCriadoDeveTerAssetTag(String assetTagEsperado) {
    String assetTag = context.getLastResponse().path("assetTag");
    assertThat(assetTag)
        .as("AssetTag incorreto na resposta de criação")
        .isEqualTo(assetTagEsperado);
  }
}
