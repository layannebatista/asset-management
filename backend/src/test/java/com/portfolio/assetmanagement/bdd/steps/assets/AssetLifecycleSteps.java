package com.portfolio.assetmanagement.bdd.steps.assets;

import static org.assertj.core.api.Assertions.assertThat;

import com.portfolio.assetmanagement.bdd.actions.AssetActions;
import com.portfolio.assetmanagement.bdd.client.ApiClient;
import com.portfolio.assetmanagement.bdd.context.ScenarioContext;
import com.portfolio.assetmanagement.bdd.support.TestDataHelper;
import com.portfolio.assetmanagement.domain.asset.entity.Asset;
import com.portfolio.assetmanagement.infrastructure.persistence.asset.repository.AssetRepository;
import io.cucumber.java.pt.E;
import io.cucumber.java.pt.Então;
import io.cucumber.java.pt.Quando;
import java.math.BigDecimal;
import org.springframework.beans.factory.annotation.Autowired;

/**
 * Steps de ciclo de vida do ativo: atribuição, desatribuição, aposentadoria, manutenção e
 * transferência — incluindo sequências e reentrâncias.
 */
public class AssetLifecycleSteps {

  @Autowired private ApiClient apiClient;
  @Autowired private ScenarioContext context;
  @Autowired private TestDataHelper testDataHelper;
  @Autowired private AssetActions assetActions;
  @Autowired private AssetRepository assetRepository;

  // =========================================================
  // APOSENTADORIA
  // =========================================================

  @Quando("tento aposentar o ativo {string}")
  public void tentoAposentarOAtivo(String assetTag) {
    assetActions.retire(assetTag);
  }

  @Quando("aposentan o ativo {string}")
  public void aposentanOAtivo(String assetTag) {
    assetActions.retire(assetTag);
  }

  @Quando("tempo aposentan o ativo {string}")
  public void tempoAposentanOAtivo(String assetTag) {
    assetActions.retire(assetTag);
  }

  @Quando("tento aposentan novamente o ativo {string}")
  public void tentoAposentanNovamente(String assetTag) {
    assetActions.retire(assetTag);
  }

  // =========================================================
  // ATRIBUIÇÃO
  // =========================================================

  @Quando("tento atribuir o ativo {string} a outro usuário")
  public void tentoAtribuirOAtivoAOutroUsuario(String assetTag) {
    Long assetId = context.getId("ativoId_" + assetTag);
    Long userId = testDataHelper.resolverFallbackUsuarioId();
    context.setLastResponse(apiClient.atribuirAtivo(assetId, userId, context.getToken()));
  }

  @Quando("tento atribuir o ativo {string} a um usuário")
  public void tentoAtribuirAtivoAUsuario(String assetTag) {
    Long assetId = context.getId("ativoId_" + assetTag);
    Long userId = testDataHelper.resolverFallbackUsuarioId();
    context.setLastResponse(apiClient.atribuirAtivo(assetId, userId, context.getToken()));
  }

  @Quando("atribuo o ativo {string} ao usuário {string}")
  public void atribuoAtivoAoUsuario(String assetTag, String email) {
    assetActions.assign(assetTag, email);
  }

  @E("que atribuo o ativo {string} ao usuário {string}")
  public void queAtribuoAtivoAoUsuario(String assetTag, String email) {
    atribuoAtivoAoUsuario(assetTag, email);
  }

  @Quando("tento atribuir novamente o ativo {string} ao mesmo usuário")
  public void tentoAtribuirNovamente(String assetTag) {
    Long assetId = context.getId("ativoId_" + assetTag);
    Long userId = context.getId("usuarioAtribuidoId");
    context.setLastResponse(apiClient.atribuirAtivo(assetId, userId, context.getToken()));
  }

  // =========================================================
  // DESATRIBUIÇÃO
  // =========================================================

  @Quando("desatribuo o ativo {string}")
  public void desatribuoOAtivo(String assetTag) {
    assetActions.unassign(assetTag);
  }

  @E("que desatribuo o ativo {string}")
  public void queDesatribuoOAtivo(String assetTag) {
    desatribuoOAtivo(assetTag);
  }

  // =========================================================
  // MANUTENÇÃO
  // =========================================================

  @Quando("solicito manutenção para o ativo {string}")
  public void solicitoManutencao(String assetTag) {
    assetActions.startMaintenance(assetTag, "Manutenção E2E");
  }

  @E("que solicito manutenção para o ativo {string}")
  public void queSolicitoManutencao(String assetTag) {
    solicitoManutencao(assetTag);
  }

  @Quando("solicito novamente manutenção para o ativo {string}")
  public void solicitoManutencaoNovaVez(String assetTag) {
    Long assetId = context.getId("ativoId_" + assetTag);
    context.setLastResponse(
        apiClient.solicitarManutencao(assetId, "Manutenção duplicada", context.getToken()));
  }

  @E("que concluo a manutenção do ativo {string}")
  public void queConcluoAManutencao(String assetTag) {
    Long assetId = context.getId("ativoId_" + assetTag);
    context.setLastResponse(apiClient.concluirManutencao(assetId, "Concluída", context.getToken()));
  }

  @Quando("tenta concluir novamente a manutenção do ativo {string}")
  public void tentaConcluirManutencaoNovaVez(String assetTag) {
    Long assetId = context.getId("ativoId_" + assetTag);
    context.setLastResponse(
        apiClient.concluirManutencao(assetId, "Conclusão duplicada", context.getToken()));
  }

  // =========================================================
  // TRANSFERÊNCIA
  // =========================================================

  @Quando("solicito transferência do ativo {string} para a unidade extra")
  public void solicitoTransferencia(String assetTag) {
    assetActions.transferToExtraUnit(assetTag, "Transferência E2E");
  }

  @E("que solicito transferência do ativo {string} para a unidade extra")
  public void queSolicitoTransferencia(String assetTag) {
    solicitoTransferencia(assetTag);
  }

  @Quando("solicito transferência do ativo {string} para a unidade extra 2")
  public void solicitoTransferenciaExtra2(String assetTag) {
    Long assetId = context.getId("ativoId_" + assetTag);
    Long toUnitId = context.getId("unidadeExtraId2");
    context.setLastResponse(
        apiClient.solicitarTransferencia(
            assetId, toUnitId, "Transferência E2E", context.getToken()));
  }

  @Quando("solicito novamente transferência do ativo {string} para a unidade extra")
  public void solicitoTransferenciaNovaVez(String assetTag) {
    Long assetId = context.getId("ativoId_" + assetTag);
    Long toUnitId = context.getId("unidadeExtraId");
    context.setLastResponse(
        apiClient.solicitarTransferencia(
            assetId, toUnitId, "Transferência duplicada", context.getToken()));
  }

  // =========================================================
  // SEQUÊNCIA — OUTROS
  // =========================================================

  @E("que aposentan o ativo {string}")
  public void queAposentanOAtivo(String assetTag) {
    aposentanOAtivo(assetTag);
  }

  // =========================================================
  // VERIFICAÇÕES DE ESTADO
  // =========================================================

  @Então("o ativo deve estar no status {string}")
  public void oAtivoDeveEstarNoStatus(String statusEsperado) {
    String currentTag = context.getCurrentAssetTag();
    Long assetId = context.getId("ativoId_" + currentTag);
    Asset asset =
        assetRepository
            .findById(assetId)
            .orElseThrow(
                () ->
                    new AssertionError(
                        "Ativo não encontrado para validação de status: " + currentTag));

    assertThat(asset.getStatus().name()).as("Status do ativo incorreto").isEqualTo(statusEsperado);
  }

  @Então("todas as operações devem ter sucesso")
  public void todasOperacoes() {
    assertThat(context.getLastResponse().statusCode()).as("Não é 4xx ou 5xx").isLessThan(400);
  }

  // =========================================================
  // MENSAGENS DE ERRO — ATRIBUIÇÃO
  // =========================================================

  @Então("a mensagem de erro deve indicar que não pode atribuir ativo em manutenção")
  public void mensagemErroManutencao() {
    assertThat((String) context.getLastResponse().path("error.message"))
        .as("Mensagem de erro não indica bloqueio de manutenção")
        .containsIgnoringCase("manutenção");
  }

  @Então("a mensagem de erro deve indicar que não pode atribuir ativo em transferência")
  public void mensagemErroTransferencia() {
    assertThat((String) context.getLastResponse().path("error.message"))
        .as("Mensagem de erro não indica bloqueio de transferência")
        .containsIgnoringCase("transferência");
  }

  @Então("a mensagem de erro deve indicar que ativo já está atribuído")
  public void mensagemErroJaAtribuido() {
    assertThat((String) context.getLastResponse().path("error.message"))
        .as("Mensagem de erro não indica que ativo já está atribuído")
        .containsIgnoringCase("atribuído");
  }

  @Então("a mensagem de erro deve indicar que não pode atribuir ativo aposentado")
  public void mensagemErroAposentado() {
    assertThat((String) context.getLastResponse().path("error.message"))
        .as("Mensagem de erro não indica bloqueio de ativo aposentado")
        .containsIgnoringCase("aposentado");
  }

  // =========================================================
  // MENSAGENS DE ERRO — DESATRIBUIÇÃO
  // =========================================================

  @Então("a mensagem de erro deve indicar que ativo já está disponível")
  public void mensagemErroJaDisponivel() {
    assertThat((String) context.getLastResponse().path("error.message"))
        .as("Mensagem de erro não indica que ativo já está disponível")
        .containsIgnoringCase("disponível");
  }

  // =========================================================
  // MENSAGENS DE ERRO — APOSENTADORIA
  // =========================================================

  @Então("a mensagem de erro deve indicar que não pode aposentar ativo em manutenção")
  public void mensagemErroAposentarManutencao() {
    assertThat((String) context.getLastResponse().path("error.message"))
        .as("Mensagem de erro não indica bloqueio de aposentadoria em manutenção")
        .containsIgnoringCase("manutenção");
  }

  // =========================================================
  // MENSAGENS DE ERRO — MANUTENÇÃO
  // =========================================================

  @Então("a mensagem de erro deve indicar que ativo está em transferência")
  public void mensagemErroEmTransferencia() {
    assertThat((String) context.getLastResponse().path("error.message"))
        .as("Mensagem de erro não indica que ativo está em transferência")
        .containsIgnoringCase("transferência");
  }

  @Então("a mensagem de erro deve indicar que ativo já está em manutenção")
  public void mensagemErroJaEmManutencao() {
    assertThat((String) context.getLastResponse().path("error.message"))
        .as("Mensagem de erro não indica que ativo já está em manutenção")
        .containsIgnoringCase("manutenção");
  }

  // =========================================================
  // MENSAGENS DE ERRO — TRANSFERÊNCIA
  // =========================================================

  @Então("a mensagem de erro deve indicar que não pode transferir ativo atribuído")
  public void mensagemErroTransferirAtribuido() {
    String responseBody = context.getLastResponse().getBody().asString();
    assertThat(responseBody)
        .as("Mensagem de erro não indica bloqueio de transferência de ativo atribuído")
        .containsAnyOf("atribuído", "não está disponível");
  }

  // =========================================================
  // APOSENTADORIA — por ID inexistente
  // =========================================================

  @Quando("tento aposentar o ativo com id {long}")
  public void tentaAposentarAtivoComId(Long id) {
    context.setLastResponse(apiClient.aposentarAtivo(id, context.getToken()));
  }

  @Quando("tento atribuir o ativo {string} a um usuário inexistente")
  public void tentoAtribuirAtivoAUsuarioInexistente(String assetTag) {
    Long assetId = context.getId("ativoId_" + assetTag);
    context.setLastResponse(apiClient.atribuirAtivo(assetId, 999999L, context.getToken()));
  }

  @Quando("tento atribuir o ativo com id {long} ao usuário {string}")
  public void tentoAtribuirAtivoComIdAoUsuario(Long assetId, String email) {
    Long userId = testDataHelper.obterIdUsuarioPorEmail(email);
    context.setLastResponse(apiClient.atribuirAtivo(assetId, userId, context.getToken()));
  }

  @Quando("desatribuo o ativo disponível {string}")
  public void desatribuoOAtivoDisponivel(String assetTag) {
    Long assetId = context.getId("ativoId_" + assetTag);
    context.setLastResponse(apiClient.desatribuirAtivo(assetId, context.getToken()));
  }

  @Quando("desatribuo o ativo com id {long}")
  public void desatribuoOAtivoComId(Long assetId) {
    context.setLastResponse(apiClient.desatribuirAtivo(assetId, context.getToken()));
  }

  // =========================================================
  // DADOS FINANCEIROS
  // =========================================================

  @Quando("atualizo os dados financeiros do ativo {string}")
  public void atualizoOsDadosFinanceirosDoAtivo(String assetTag) {
    Long assetId = context.getId("ativoId_" + assetTag);
    context.setId("ativoFinanceiroId", assetId);
    context.setLastResponse(
        apiClient.atualizarDadosFinanceiros(
            assetId, new BigDecimal("1500.00"), "Fornecedor Teste", context.getToken()));
  }

  @Então("os dados financeiros devem estar atualizados")
  public void osDadosFinanceirosDevemEstarAtualizados() {
    assertThat(context.getLastResponse().statusCode())
        .as("Atualização financeira deve retornar 200")
        .isEqualTo(200);

    Long assetId;
    String currentTag;
    try {
      assetId = context.getId("ativoFinanceiroId");
      currentTag = "ativoFinanceiroId";
    } catch (IllegalStateException ex) {
      currentTag = context.getCurrentAssetTag();
      assetId = context.getId("ativoId_" + currentTag);
    }

    java.util.Optional<Asset> optionalAsset = assetRepository.findById(assetId);
    if (optionalAsset.isEmpty()) {
      throw new AssertionError("Ativo não encontrado para validação financeira: " + currentTag);
    }
    Asset asset = optionalAsset.get();

    String supplier = asset.getSupplier();
    assertThat(supplier)
        .as("Campo supplier deve ter sido atualizado")
        .isEqualTo("Fornecedor Teste");
  }
}
