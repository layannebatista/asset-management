package com.portfolio.assetmanagement.integration.transfer;

import static org.assertj.core.api.Assertions.assertThat;

import com.portfolio.assetmanagement.domain.asset.entity.Asset;
import com.portfolio.assetmanagement.domain.transfer.enums.TransferStatus;
import com.portfolio.assetmanagement.domain.unit.entity.Unit;
import com.portfolio.assetmanagement.integration.BaseIntegrationTest;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import io.qameta.allure.Story;
import io.restassured.module.mockmvc.response.MockMvcResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

@Epic("Backend")
@Feature("Integração — Transfer")
@DisplayName("Listagem de Transferências")
@Tag("testType=Integration")
@Tag("module=Transfer")
class TransferQueryIntegrationTest extends BaseIntegrationTest {

  private void criarTransferenciasParaListagem(Unit destino) {
    String token = loginComoAdmin();
    Asset asset1 = criarAtivo("TRANSFER-LIST-01");
    Asset asset2 = criarAtivo("TRANSFER-LIST-02");

    Long approvedId =
        ((Number)
                apiClient
                    .solicitarTransferencia(asset1.getId(), destino.getId(), "Aprovável", token)
                    .path("id"))
            .longValue();
    apiClient.aprovarTransferencia(approvedId, "ok", token);

    apiClient.solicitarTransferencia(asset2.getId(), destino.getId(), "Pendente", token);
  }

  @Test
  @Story("Consulta")
  @Severity(SeverityLevel.NORMAL)
  @DisplayName(
      "[INTEGRACAO][ASSET] TQI01 - Listar transferências com paginação retorna 200 e campos page")
  void tqi01ListarTransferenciasComPaginacao() {
    Unit destino = testDataHelper.criarUnidade("Filial TQI01", organizacao);
    criarTransferenciasParaListagem(destino);

    MockMvcResponse response = apiClient.listarTransferencias(null, null, null, loginComoAdmin());

    assertThat(response.statusCode()).isEqualTo(200);
    assertThat((Integer) response.path("page")).isEqualTo(0);
    assertThat((Integer) response.path("size")).isGreaterThan(0);
    assertThat(((Number) response.path("totalElements")).intValue()).isGreaterThanOrEqualTo(2);
  }

  @Test
  @Story("Consulta")
  @Severity(SeverityLevel.NORMAL)
  @DisplayName(
      "[INTEGRACAO][ASSET] TQI02 - Filtrar transferências por status retorna apenas itens esperados")
  void tqi02FiltrarTransferenciasPorStatus() {
    Unit destino = testDataHelper.criarUnidade("Filial TQI02", organizacao);
    criarTransferenciasParaListagem(destino);

    MockMvcResponse response =
        apiClient.listarTransferencias(TransferStatus.APPROVED, null, null, loginComoAdmin());

    assertThat(response.statusCode()).isEqualTo(200);
    assertThat(((Number) response.path("totalElements")).intValue()).isEqualTo(1);
    assertThat((String) response.path("content[0].status")).isEqualTo("APPROVED");
  }

  @Test
  @Story("Consulta")
  @Severity(SeverityLevel.NORMAL)
  @DisplayName(
      "[INTEGRACAO][ASSET] TQI03 - Filtrar transferências por assetId retorna item correto")
  void tqi03FiltrarTransferenciasPorAssetId() {
    Unit destino = testDataHelper.criarUnidade("Filial TQI03", organizacao);
    String token = loginComoAdmin();
    Asset alvo = criarAtivo("TRANSFER-LIST-03");
    criarAtivo("TRANSFER-LIST-03B");
    apiClient.solicitarTransferencia(alvo.getId(), destino.getId(), "Somente este ativo", token);

    MockMvcResponse response = apiClient.listarTransferencias(null, alvo.getId(), null, token);

    assertThat(response.statusCode()).isEqualTo(200);
    assertThat(((Number) response.path("totalElements")).intValue()).isEqualTo(1);
    assertThat(((Number) response.path("content[0].assetId")).longValue()).isEqualTo(alvo.getId());
  }

  @Test
  @Story("Consulta")
  @Severity(SeverityLevel.NORMAL)
  @DisplayName(
      "[INTEGRACAO][ASSET] TQI04 - Filtrar transferências por unitId retorna itens da unidade")
  void tqi04FiltrarTransferenciasPorUnitId() {
    Unit destino = testDataHelper.criarUnidade("Filial TQI04", organizacao);
    criarTransferenciasParaListagem(destino);

    MockMvcResponse response =
        apiClient.listarTransferencias(null, null, destino.getId(), loginComoAdmin());

    assertThat(response.statusCode()).isEqualTo(200);
    assertThat(((Number) response.path("totalElements")).intValue()).isGreaterThanOrEqualTo(2);
    assertThat(((Number) response.path("content[0].toUnitId")).longValue())
        .isEqualTo(destino.getId());
  }

  @Test
  @Story("Controle de acesso")
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("[INTEGRACAO][ASSET] TQI05 - GESTOR vê apenas transferências da própria unidade")
  void tqi05GestorVeApenasTransferenciasDaPropriaUnidade() {
    Unit outraUnidade = testDataHelper.criarUnidade("Filial TQI05", organizacao);
    String token = loginComoAdmin();
    Asset assetLocal = criarAtivo("TRANSFER-LIST-05A");
    Asset assetOutra =
        testDataHelper.criarAtivo(
            "TRANSFER-LIST-05B",
            com.portfolio.assetmanagement.domain.asset.enums.AssetType.NOTEBOOK,
            organizacao,
            outraUnidade);
    apiClient.solicitarTransferencia(
        assetLocal.getId(), outraUnidade.getId(), "Visível para gestor", token);
    apiClient.solicitarTransferencia(assetOutra.getId(), unidade.getId(), "Também visível", token);

    MockMvcResponse response = apiClient.listarTransferencias(null, null, null, loginComoGestor());

    assertThat(response.statusCode()).isEqualTo(200);
    assertThat(((Number) response.path("totalElements")).intValue()).isEqualTo(2);
  }
}
