package com.portfolio.assetmanagement.integration.asset;

import static io.restassured.module.mockmvc.RestAssuredMockMvc.given;
import static org.assertj.core.api.Assertions.assertThat;

import com.portfolio.assetmanagement.domain.asset.enums.AssetStatus;
import com.portfolio.assetmanagement.domain.asset.enums.AssetType;
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
import org.junit.jupiter.api.Tag;

@Epic("Backend")
@Feature("Integração — Assets")
@DisplayName("Filtros e Paginação de Ativos")
@Tag("testType=Integration")
@Tag("module=Asset")
class AssetFilterIntegrationTest extends BaseIntegrationTest {

  @Test
  @Story("Listagem de ativos")
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("Lista todos os ativos da organização sem filtros")
  void listaAtivosSemFiltros() {
    criarAtivo("FILTER-001");
    criarAtivo("FILTER-002");
    String token = loginComoAdmin();

    MockMvcResponse response = apiClient.listarAtivos(token);

    assertThat(response.statusCode()).isEqualTo(200);
    assertThat((Integer) response.path("totalElements")).isGreaterThanOrEqualTo(2);
  }

  @Test
  @Story("Filtros")
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("Filtra ativos por assetTag")
  void filtraPorAssetTag() {
    criarAtivo("FILTER-UNIQUE-001");
    criarAtivo("FILTER-UNIQUE-002");
    String token = loginComoAdmin();

    MockMvcResponse response =
        given()
            .contentType("application/json")
            .header("Authorization", "Bearer " + token)
            .queryParam("assetTag", "FILTER-UNIQUE-001")
            .when()
            .get("/assets")
            .then()
            .extract()
            .response();

    assertThat(response.statusCode()).isEqualTo(200);
    assertThat((Integer) response.path("totalElements")).isEqualTo(1);
    assertThat((String) response.path("content[0].assetTag")).isEqualTo("FILTER-UNIQUE-001");
  }

  @Test
  @Story("Filtros")
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("Filtra ativos por tipo")
  void filtraPorTipo() {
    criarAtivo("FILTER-NB-001", AssetType.NOTEBOOK);
    criarAtivo("FILTER-DT-001", AssetType.DESKTOP);
    String token = loginComoAdmin();

    MockMvcResponse response =
        given()
            .contentType("application/json")
            .header("Authorization", "Bearer " + token)
            .queryParam("type", "NOTEBOOK")
            .when()
            .get("/assets")
            .then()
            .extract()
            .response();

    assertThat(response.statusCode()).isEqualTo(200);
    Integer total = response.path("totalElements");
    assertThat(total).isGreaterThanOrEqualTo(1);
    assertThat((String) response.path("content[0].type")).isEqualTo("NOTEBOOK");
  }

  @Test
  @Story("Paginação")
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("Paginação retorna campos page corretos")
  void paginacaoRetornaCamposCorretos() {
    criarAtivo("PAGE-001");
    String token = loginComoAdmin();

    MockMvcResponse response =
        given()
            .contentType("application/json")
            .header("Authorization", "Bearer " + token)
            .queryParam("page", 0)
            .queryParam("size", 5)
            .when()
            .get("/assets")
            .then()
            .extract()
            .response();

    assertThat(response.statusCode()).isEqualTo(200);
    assertThat((Integer) response.path("page")).isEqualTo(0);
    assertThat((Integer) response.path("size")).isEqualTo(5);
    assertThat((Integer) response.path("totalElements")).isNotNull();
  }

  @Test
  @Story("Filtros")
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("Filtra ativos por status")
  void filtraPorStatus() {
    criarAtivo("FILTER-STATUS-001");
    String token = loginComoAdmin();

    MockMvcResponse response =
        given()
            .contentType("application/json")
            .header("Authorization", "Bearer " + token)
            .queryParam("status", "AVAILABLE")
            .when()
            .get("/assets")
            .then()
            .extract()
            .response();

    assertThat(response.statusCode()).isEqualTo(200);
    assertThat((Integer) response.path("totalElements")).isGreaterThanOrEqualTo(1);
    assertThat((String) response.path("content[0].status")).isEqualTo("AVAILABLE");
  }

  @Test
  @Story("Filtros")
  @Severity(SeverityLevel.TRIVIAL)
  @DisplayName("Filtra ativos por modelo (search)")
  void filtraPorModelo() {
    testDataHelper.criarAtivoComStatus(
        "FILTER-DELL-001", AssetType.NOTEBOOK, "Dell XPS 15",
        organizacao, unidade,
        com.portfolio.assetmanagement.domain.asset.enums.AssetStatus.AVAILABLE);
    String token = loginComoAdmin();

    MockMvcResponse response =
        given()
            .contentType("application/json")
            .header("Authorization", "Bearer " + token)
            .queryParam("model", "Dell XPS 15")
            .when()
            .get("/assets")
            .then()
            .extract()
            .response();

    assertThat(response.statusCode()).isEqualTo(200);
    assertThat((Integer) response.path("totalElements")).isGreaterThanOrEqualTo(1);
    assertThat((String) response.path("content[0].assetTag")).isEqualTo("FILTER-DELL-001");
  }

  @Test
  @Story("Controle de acesso")
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("GESTOR só vê ativos da sua unidade ao filtrar")
  void gestorSoVeAtivosDaSuaUnidade() {
    Unit outraUnidade = testDataHelper.criarUnidade("Filial", organizacao);
    testDataHelper.criarAtivo("FILTER-UNIT-A", AssetType.NOTEBOOK, organizacao, unidade);
    testDataHelper.criarAtivo("FILTER-UNIT-B", AssetType.NOTEBOOK, organizacao, outraUnidade);
    String token = loginComoGestor();

    MockMvcResponse response =
        given()
            .contentType("application/json")
            .header("Authorization", "Bearer " + token)
            .when()
            .get("/assets")
            .then()
            .extract()
            .response();

    assertThat(response.statusCode()).isEqualTo(200);
    assertThat((Integer) response.path("totalElements")).isEqualTo(1);
    assertThat((String) response.path("content[0].assetTag")).isEqualTo("FILTER-UNIT-A");
  }
}
