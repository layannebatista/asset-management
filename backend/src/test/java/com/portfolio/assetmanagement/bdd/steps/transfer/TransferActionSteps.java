package com.portfolio.assetmanagement.bdd.steps.transfer;

import static org.assertj.core.api.Assertions.assertThat;

import com.portfolio.assetmanagement.bdd.client.ApiClient;
import com.portfolio.assetmanagement.bdd.context.ScenarioContext;
import com.portfolio.assetmanagement.domain.transfer.enums.TransferStatus;
import io.cucumber.java.pt.Quando;
import io.restassured.module.mockmvc.response.MockMvcResponse;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;

/** Steps de ações de transferência. */
public class TransferActionSteps {

  @Autowired private ApiClient apiClient;
  @Autowired private ScenarioContext context;
  @Autowired private TransferStepsContext transferContext;

  // =========================================================
  // AÇÕES — REQUISIÇÃO
  // =========================================================

  @Quando("solicito transferência sem assetId para a unidade de destino com motivo {string}")
  public void solicitoTransferenciaSemAssetId(String motivo) {
    Long unidadeDestinoId = transferContext.getUnidadeDestinoId();
    MockMvcResponse response =
        apiClient.solicitarTransferenciaSemAssetId(unidadeDestinoId, motivo, context.getToken());
    setLastResponse(response);
  }

  @Quando("solicito transferência do ativo {string} sem unidade de destino com motivo {string}")
  public void solicitoTransferenciaSemUnidadeDestino(String assetTag, String motivo) {
    Long assetId = context.getId("ativoId_" + assetTag);
    MockMvcResponse response =
        apiClient.solicitarTransferenciaSemToUnitId(assetId, motivo, context.getToken());
    setLastResponse(response);
  }

  @Quando("solicito transferência do ativo {string} para a unidade de destino sem motivo")
  public void solicitoTransferenciaSemMotivo(String assetTag) {
    Long assetId = context.getId("ativoId_" + assetTag);
    Long unidadeDestinoId = transferContext.getUnidadeDestinoId();
    MockMvcResponse response =
        apiClient.solicitarTransferenciaSemMotivo(assetId, unidadeDestinoId, context.getToken());
    setLastResponse(response);
  }

  @Quando("solicito transferência do ativo {string} para a unidade de destino com motivo {string}")
  public void solicitoTransferenciaDoAtivoParaAUnidadeDeDestinoComMotivo(
      String assetTag, String motivo) {
    Long assetId = context.getId("ativoId_" + assetTag);
    Long unidadeDestinoId = transferContext.getUnidadeDestinoId();

    MockMvcResponse response =
        apiClient.solicitarTransferencia(assetId, unidadeDestinoId, motivo, context.getToken());
    setLastResponse(response);

    if (response.statusCode() == 201) {
      Number transferId = response.path("id");
      assertThat(transferId).as("ID da transferência não encontrado na resposta").isNotNull();
      transferContext.setTransferId(transferId.longValue());
      context.setLastCreatedId(transferId.longValue());
    }
  }

  @Quando(
      "solicito transferência do ativo {string} para a unidade de destino com motivo {string} sem autenticação")
  public void solicitoTransferenciaSemAutenticacao(String assetTag, String motivo) {
    Long assetId = context.getId("ativoId_" + assetTag);
    Long unidadeDestinoId = transferContext.getUnidadeDestinoId();

    MockMvcResponse response =
        apiClient.postSemToken(
            "/transfers",
            Map.of("assetId", assetId, "toUnitId", unidadeDestinoId, "reason", motivo));
    setLastResponse(response);
  }

  @Quando(
      "solicito transferência do ativo com ID {string} para a unidade de destino com motivo {string}")
  public void solicitoTransferenciaComAssetIdInvalido(String assetId, String motivo) {
    Long unidadeDestinoId = transferContext.getUnidadeDestinoId();
    MockMvcResponse response =
        apiClient.solicitarTransferencia(
            Long.parseLong(assetId), unidadeDestinoId, motivo, context.getToken());
    setLastResponse(response);
  }

  @Quando(
      "solicito transferência do ativo {string} para a unidade com ID {string} com motivo {string}")
  public void solicitoTransferenciaComToUnitIdInvalido(
      String assetTag, String toUnitId, String motivo) {
    Long assetId = context.getId("ativoId_" + assetTag);
    MockMvcResponse response =
        apiClient.solicitarTransferencia(
            assetId, Long.parseLong(toUnitId), motivo, context.getToken());
    setLastResponse(response);
  }

  // =========================================================
  // AÇÕES — APROVAÇÃO / REJEIÇÃO / CONCLUSÃO / CANCELAMENTO
  // =========================================================

  @Quando("aprovo a transferência salva com comentário {string}")
  public void aprovoATransferenciaSalvaComComentario(String comentario) {
    Long transferId = transferContext.getTransferId();
    MockMvcResponse response =
        apiClient.aprovarTransferencia(transferId, comentario, context.getToken());
    setLastResponse(response);
  }

  @Quando("aprovo a transferência com ID {string} com comentário {string}")
  public void aprovoATransferenciaComId(String transferId, String comentario) {
    MockMvcResponse response =
        apiClient.aprovarTransferencia(Long.parseLong(transferId), comentario, context.getToken());
    setLastResponse(response);
  }

  @Quando("aprovo a transferência salva com comentário {string} sem autenticação")
  public void aprovoATransferenciaSemAutenticacao(String comentario) {
    Long transferId = transferContext.getTransferId();
    MockMvcResponse response =
        apiClient.patchSemToken(
            "/transfers/" + transferId + "/approve", Map.of("comment", comentario));
    setLastResponse(response);
  }

  @Quando("rejeito a transferência salva com comentário {string}")
  public void rejeitoATransferenciaSalvaComComentario(String comentario) {
    Long transferId = transferContext.getTransferId();
    MockMvcResponse response =
        apiClient.rejeitarTransferencia(transferId, comentario, context.getToken());
    setLastResponse(response);
  }

  @Quando("rejeito a transferência com ID {string} com comentário {string}")
  public void rejeitoATransferenciaComId(String transferId, String comentario) {
    MockMvcResponse response =
        apiClient.rejeitarTransferencia(Long.parseLong(transferId), comentario, context.getToken());
    setLastResponse(response);
  }

  @Quando("rejeito a transferência salva com comentário {string} sem autenticação")
  public void rejeitoATransferenciaSemAutenticacao(String comentario) {
    Long transferId = transferContext.getTransferId();
    MockMvcResponse response =
        apiClient.patchSemToken(
            "/transfers/" + transferId + "/reject", Map.of("comment", comentario));
    setLastResponse(response);
  }

  @Quando("concluo a transferência salva")
  public void concluoATransferenciaSalva() {
    Long transferId = transferContext.getTransferId();
    MockMvcResponse response = apiClient.concluirTransferencia(transferId, context.getToken());
    setLastResponse(response);
  }

  @Quando("concluo a transferência com ID {string}")
  public void concluoATransferenciaComId(String transferId) {
    MockMvcResponse response =
        apiClient.concluirTransferencia(Long.parseLong(transferId), context.getToken());
    setLastResponse(response);
  }

  @Quando("cancelo a transferência salva")
  public void canceloATransferenciaSalva() {
    Long transferId = transferContext.getTransferId();
    MockMvcResponse response = apiClient.cancelarTransferencia(transferId, context.getToken());
    setLastResponse(response);
  }

  @Quando("cancelo a transferência com ID {string}")
  public void canceloATransferenciaComId(String transferId) {
    MockMvcResponse response =
        apiClient.cancelarTransferencia(Long.parseLong(transferId), context.getToken());
    setLastResponse(response);
  }

  @Quando("listo as transferências")
  public void listoAsTransferencias() {
    MockMvcResponse response = apiClient.listarTransferencias(null, null, null, context.getToken());
    setLastResponse(response);
  }

  @Quando("listo as transferências com status {string}")
  public void listoAsTransferenciasComStatus(String status) {
    MockMvcResponse response =
        apiClient.listarTransferencias(
            TransferStatus.valueOf(status), null, null, context.getToken());
    setLastResponse(response);
  }

  @Quando("listo as transferências do ativo {string}")
  public void listoAsTransferenciasDoAtivo(String assetTag) {
    Long assetId = context.getId("ativoId_" + assetTag);
    MockMvcResponse response =
        apiClient.listarTransferencias(null, assetId, null, context.getToken());
    setLastResponse(response);
  }

  @Quando("listo as transferências da unidade de destino atual")
  public void listoAsTransferenciasDaUnidadeDeDestinoAtual() {
    Long unitId = transferContext.getUnidadeDestinoId();
    MockMvcResponse response =
        apiClient.listarTransferencias(null, null, unitId, context.getToken());
    setLastResponse(response);
  }

  @Quando("listo as transferências sem autenticação")
  public void listoAsTransferenciasSemAutenticacao() {
    MockMvcResponse response = apiClient.getSemToken("/transfers");
    setLastResponse(response);
  }

  // =========================================================
  // HELPERS INTERNOS
  // =========================================================

  private void setLastResponse(MockMvcResponse response) {
    context.setLastResponse(response);
  }
}
