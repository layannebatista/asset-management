package com.portfolio.assetmanagement.bdd.steps;

import static org.assertj.core.api.Assertions.assertThat;

import com.portfolio.assetmanagement.bdd.client.ApiClient;
import com.portfolio.assetmanagement.bdd.context.ScenarioContext;
import com.portfolio.assetmanagement.bdd.support.TestDataHelper;
import com.portfolio.assetmanagement.domain.asset.entity.Asset;
import com.portfolio.assetmanagement.domain.organization.entity.Organization;
import com.portfolio.assetmanagement.domain.transfer.entity.TransferRequest;
import com.portfolio.assetmanagement.domain.unit.entity.Unit;
import com.portfolio.assetmanagement.infrastructure.persistence.asset.repository.AssetRepository;
import com.portfolio.assetmanagement.infrastructure.persistence.organization.repository.OrganizationRepository;
import com.portfolio.assetmanagement.infrastructure.persistence.transfer.repository.TransferRepository;
import com.portfolio.assetmanagement.infrastructure.persistence.unit.repository.UnitRepository;
import io.cucumber.java.pt.E;
import io.cucumber.java.pt.Então;
import io.cucumber.java.pt.Quando;
import io.restassured.module.mockmvc.response.MockMvcResponse;
import org.springframework.beans.factory.annotation.Autowired;

public class TransferSteps {

  @Autowired private ApiClient apiClient;
  @Autowired private ScenarioContext context;
  @Autowired private TestDataHelper testDataHelper;
  @Autowired private AssetRepository assetRepository;
  @Autowired private TransferRepository transferRepository;
  @Autowired private OrganizationRepository organizationRepository;
  @Autowired private UnitRepository unitRepository;

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
    context.setId("unidadeDestinoId", unidadeDestino.getId());
  }

  @E("que a unidade de destino é a própria unidade de origem")
  public void queAUnidadeDeDestinoEAAPropriaUnidadeDeOrigem() {
    context.setId("unidadeDestinoId", context.getId("unidadeId"));
  }

  @E("que existe um ativo {string} em manutenção nessa unidade")
  public void queExisteUmAtivoEmManutencao(String assetTag) {
    Organization org = organizationRepository.findById(context.getId("organizacaoId")).orElseThrow();
    Unit unit = unitRepository.findById(context.getId("unidadeId")).orElseThrow();
    Asset ativo = testDataHelper.criarAtivoEmManutencao(org, unit);
    context.setId("ativoId_" + assetTag, ativo.getId());
  }

  @E("que existe um ativo {string} atribuído nessa unidade")
  public void queExisteUmAtivoAtribuido(String assetTag) {
    Organization org = organizationRepository.findById(context.getId("organizacaoId")).orElseThrow();
    Unit unit = unitRepository.findById(context.getId("unidadeId")).orElseThrow();
    Asset ativo = testDataHelper.criarAtivo(assetTag, com.portfolio.assetmanagement.domain.asset.enums.AssetType.NOTEBOOK, org, unit);
    ativo.changeStatus(com.portfolio.assetmanagement.domain.asset.enums.AssetStatus.ASSIGNED);
    assetRepository.save(ativo);
    context.setId("ativoId_" + assetTag, ativo.getId());
  }

  @E("que existe um ativo {string} aposentado nessa unidade")
  public void queExisteUmAtivoAposentado(String assetTag) {
    Organization org = organizationRepository.findById(context.getId("organizacaoId")).orElseThrow();
    Unit unit = unitRepository.findById(context.getId("unidadeId")).orElseThrow();
    Asset ativo = testDataHelper.criarAtivoAposentado(org, unit);
    context.setId("ativoId_" + assetTag, ativo.getId());
  }

  @Quando("solicito transferência sem assetId para a unidade de destino com motivo {string}")
  public void solicitoTransferenciaSemAssetId(String motivo) {
    Long unidadeDestinoId = context.getId("unidadeDestinoId");
    MockMvcResponse response =
        apiClient.solicitarTransferenciaSemAssetId(unidadeDestinoId, motivo, context.getToken());
    context.setLastResponse(response);
  }

  @Quando("solicito transferência do ativo {string} sem unidade de destino com motivo {string}")
  public void solicitoTransferenciaSemUnidadeDestino(String assetTag, String motivo) {
    Long assetId = context.getId("ativoId_" + assetTag);
    MockMvcResponse response =
        apiClient.solicitarTransferenciaSemToUnitId(assetId, motivo, context.getToken());
    context.setLastResponse(response);
  }

  @Quando("solicito transferência do ativo {string} para a unidade de destino sem motivo")
  public void solicitoTransferenciaSemMotivo(String assetTag) {
    Long assetId = context.getId("ativoId_" + assetTag);
    Long unidadeDestinoId = context.getId("unidadeDestinoId");
    MockMvcResponse response =
        apiClient.solicitarTransferenciaSemMotivo(assetId, unidadeDestinoId, context.getToken());
    context.setLastResponse(response);
  }

  @Quando("solicito transferência do ativo {string} para a unidade de destino com motivo {string}")
  public void solicitoTransferenciaDoAtivoParaAUnidadeDeDestinoComMotivo(
      String assetTag, String motivo) {
    Long assetId = context.getId("ativoId_" + assetTag);
    Long unidadeDestinoId = context.getId("unidadeDestinoId");

    MockMvcResponse response =
        apiClient.solicitarTransferencia(assetId, unidadeDestinoId, motivo, context.getToken());
    context.setLastResponse(response);

    if (response.statusCode() == 201) {
      Number transferId = response.path("id");
      assertThat(transferId).as("ID da transferência não encontrado na resposta").isNotNull();
      context.setLastCreatedId(transferId.longValue());
    }
  }

  @Quando("aprovo a transferência salva com comentário {string}")
  public void aprovoATransferenciaSalvaComComentario(String comentario) {
    MockMvcResponse response =
        apiClient.aprovarTransferencia(context.getLastCreatedId(), comentario, context.getToken());
    context.setLastResponse(response);
  }

  @Quando("rejeito a transferência salva com comentário {string}")
  public void rejeitoATransferenciaSalvaComComentario(String comentario) {
    MockMvcResponse response =
        apiClient.rejeitarTransferencia(context.getLastCreatedId(), comentario, context.getToken());
    context.setLastResponse(response);
  }

  @Quando("concluo a transferência salva")
  public void concluoATransferenciaSalva() {
    MockMvcResponse response =
        apiClient.concluirTransferencia(context.getLastCreatedId(), context.getToken());
    context.setLastResponse(response);
  }

  @Quando("cancelo a transferência salva")
  public void canceloATransferenciaSalva() {
    MockMvcResponse response =
        apiClient.cancelarTransferencia(context.getLastCreatedId(), context.getToken());
    context.setLastResponse(response);
  }

  @Então("o status da transferência salva deve ser {string}")
  public void oStatusDaTransferenciaSalvaDeveSer(String statusEsperado) {
    TransferRequest transferencia =
        transferRepository
            .findById(context.getLastCreatedId())
            .orElseThrow(
                () ->
                    new AssertionError(
                        "Transferência não encontrada no banco: " + context.getLastCreatedId()));

    assertThat(transferencia.getStatus().name())
        .as("Status da transferência incorreto")
        .isEqualTo(statusEsperado);
  }

  @E("o ativo {string} deve ficar com status {string}")
  public void oAtivoDeveFicarComStatus(String assetTag, String statusEsperado) {
    Long assetId = context.getId("ativoId_" + assetTag);
    Asset ativo =
        assetRepository
            .findById(assetId)
            .orElseThrow(() -> new AssertionError("Ativo não encontrado no banco: " + assetTag));

    assertThat(ativo.getStatus().name())
        .as("Status do ativo após transferência incorreto")
        .isEqualTo(statusEsperado);
  }

  @E("o ativo {string} deve estar na unidade de destino")
  public void oAtivoDeveEstarNaUnidadeDeDestino(String assetTag) {
    Long assetId = context.getId("ativoId_" + assetTag);
    Long unidadeDestinoId = context.getId("unidadeDestinoId");

    Asset ativo =
        assetRepository
            .findById(assetId)
            .orElseThrow(() -> new AssertionError("Ativo não encontrado no banco: " + assetTag));

    assertThat(ativo.getUnit()).as("Ativo sem unidade após concluir transferência").isNotNull();
    assertThat(ativo.getUnit().getId())
        .as("Ativo não foi movido para a unidade de destino")
        .isEqualTo(unidadeDestinoId);
  }
}
