package com.portfolio.assetmanagement.bdd.steps.transfer;

import static org.assertj.core.api.Assertions.assertThat;

import com.portfolio.assetmanagement.bdd.context.ScenarioContext;
import com.portfolio.assetmanagement.domain.asset.entity.Asset;
import com.portfolio.assetmanagement.domain.transfer.entity.TransferRequest;
import com.portfolio.assetmanagement.infrastructure.persistence.asset.repository.AssetRepository;
import com.portfolio.assetmanagement.infrastructure.persistence.transfer.repository.TransferRepository;
import io.cucumber.java.pt.E;
import io.cucumber.java.pt.Então;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;

/** Steps de verificações para transferência. */
public class TransferVerificationSteps {

  @Autowired private ScenarioContext context;
  @Autowired private TransferStepsContext transferContext;
  @Autowired private AssetRepository assetRepository;
  @Autowired private TransferRepository transferRepository;

  // =========================================================
  // VERIFICAÇÕES — STATUS DE TRANSFERÊNCIA
  // =========================================================

  @Então("o status da transferência salva deve ser {string}")
  public void oStatusDaTransferenciaSalvaDeveSer(String statusEsperado) {
    Long transferId = transferContext.getTransferId();
    TransferRequest transferencia =
        transferRepository
            .findById(transferId)
            .orElseThrow(
                () -> new AssertionError("Transferência não encontrada no banco: " + transferId));

    assertThat(transferencia.getStatus().name())
        .as("Status da transferência incorreto")
        .isEqualTo(statusEsperado);
  }

  // =========================================================
  // VERIFICAÇÕES — STATUS DO ATIVO
  // =========================================================

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
    Long unidadeDestinoId = transferContext.getUnidadeDestinoId();

    Asset ativo =
        assetRepository
            .findById(assetId)
            .orElseThrow(() -> new AssertionError("Ativo não encontrado no banco: " + assetTag));

    assertThat(ativo.getUnit()).as("Ativo sem unidade após concluir transferência").isNotNull();
    assertThat(ativo.getUnit().getId())
        .as("Ativo não foi movido para a unidade de destino")
        .isEqualTo(unidadeDestinoId);
  }

  @E("a resposta deve conter exatamente {int} transferências")
  public void aRespostaDeveConterExatamenteTransferencias(int quantidade) {
    Number totalElements = context.getLastResponse().path("totalElements");
    assertThat(totalElements).as("Campo totalElements não encontrado na resposta").isNotNull();
    assertThat(totalElements.longValue())
        .as("Quantidade total de transferências incorreta")
        .isEqualTo(quantidade);
  }

  @E("a resposta deve conter transferência do ativo {string}")
  public void aRespostaDeveConterTransferenciaDoAtivo(String assetTag) {
    Long assetId = context.getId("ativoId_" + assetTag);
    List<Integer> assetIds = context.getLastResponse().path("content.assetId");
    assertThat(assetIds).as("Lista de assetId não encontrada na resposta").isNotNull();
    assertThat(assetIds.stream().map(Long::valueOf).toList())
        .as("Transferência do ativo '%s' não encontrada na resposta", assetTag)
        .contains(assetId);
  }

  @E("a resposta não deve conter transferência do ativo {string}")
  public void aRespostaNaoDeveConterTransferenciaDoAtivo(String assetTag) {
    Long assetId = context.getId("ativoId_" + assetTag);
    List<Integer> assetIds = context.getLastResponse().path("content.assetId");
    assertThat(assetIds).as("Lista de assetId não encontrada na resposta").isNotNull();
    assertThat(assetIds.stream().map(Long::valueOf).toList())
        .as("Transferência do ativo '%s' não deveria estar visível na resposta", assetTag)
        .doesNotContain(assetId);
  }

  @E("a resposta deve conter apenas transferências com status {string}")
  public void aRespostaDeveConterApenasTransferenciasComStatus(String status) {
    List<String> statuses = context.getLastResponse().path("content.status");
    assertThat(statuses)
        .as("Lista de status não encontrada na resposta")
        .isNotNull()
        .isNotEmpty()
        .allMatch(statusAtual -> status.equals(statusAtual));
  }
}
