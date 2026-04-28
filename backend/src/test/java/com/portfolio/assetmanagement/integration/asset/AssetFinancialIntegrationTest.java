package com.portfolio.assetmanagement.integration.asset;

import static org.assertj.core.api.Assertions.assertThat;

import com.portfolio.assetmanagement.domain.asset.entity.Asset;
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
@Feature("Integração — Assets")
@DisplayName("Dados Financeiros de Ativos")
@Tag("testType=Integration")
@Tag("module=Asset")
class AssetFinancialIntegrationTest extends BaseIntegrationTest {

  @Test
  @Story("Controle de acesso — dados financeiros")
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName(
      "[INTEGRACAO][ASSET] AF09 - OPERADOR não pode atualizar dados financeiros — retorna 403")
  void af09OperadorNaoPodeAtualizarDadosFinanceiros() {
    Asset ativo = criarAtivo("FINANCIAL-009");
    String token = loginComoOperador();

    MockMvcResponse response =
        apiClient.atualizarDadosFinanceiros(
            ativo.getId(), new java.math.BigDecimal("1500.00"), null, token);

    assertThat(response.statusCode()).isEqualTo(403);
  }

  @Test
  @Story("Controle de acesso — dados financeiros")
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName(
      "[INTEGRACAO][ASSET] AF10 - GESTOR não pode atualizar dados financeiros de ativo em outra unidade — retorna 403")
  void af10GestorNaoPodeAtualizarFinanceiroEmOutraUnidade() {
    // Ativo criado em uma segunda unidade, fora do escopo do GESTOR padrão
    var outraUnidade = testDataHelper.criarUnidade("Filial Financeira", organizacao);
    var ativoOutraUnidade =
        testDataHelper.criarAtivo(
            "FINANCIAL-010",
            com.portfolio.assetmanagement.domain.asset.enums.AssetType.NOTEBOOK,
            organizacao,
            outraUnidade);

    String tokenGestor = loginComoGestor();

    MockMvcResponse response =
        apiClient.atualizarDadosFinanceiros(
            ativoOutraUnidade.getId(), new java.math.BigDecimal("2000.00"), null, tokenGestor);

    assertThat(response.statusCode()).isEqualTo(403);
  }
}
