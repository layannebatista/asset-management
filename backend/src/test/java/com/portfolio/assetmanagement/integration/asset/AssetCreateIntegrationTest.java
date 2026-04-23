package com.portfolio.assetmanagement.integration.asset;

import static io.restassured.module.mockmvc.RestAssuredMockMvc.given;
import static org.assertj.core.api.Assertions.assertThat;

import com.portfolio.assetmanagement.domain.asset.enums.AssetType;
import com.portfolio.assetmanagement.integration.BaseIntegrationTest;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import io.qameta.allure.Story;
import io.restassured.http.ContentType;
import io.restassured.module.mockmvc.response.MockMvcResponse;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@Epic("Backend")
@Feature("Integração — Assets")
@DisplayName("Criação de Ativos")
class AssetCreateIntegrationTest extends BaseIntegrationTest {

@Test
@Story("Criação de ativo")
@Severity(SeverityLevel.CRITICAL)
@DisplayName("ADMIN cria ativo com assetTag explícito — retorna 201 e campos corretos")
void criaAtivoComAssetTagExplicito() {
String token = loginComoAdmin();

MockMvcResponse response =
    apiClient.criarAtivo(
        organizacao.getId(), "ASSET-E2E-001", AssetType.NOTEBOOK, "Dell XPS 15",
        unidade.getId(), token);

assertThat(response.statusCode()).isEqualTo(201);
assertThat((String) response.path("assetTag")).isEqualTo("ASSET-E2E-001");
assertThat((String) response.path("type")).isEqualTo("NOTEBOOK");
assertThat((String) response.path("model")).isEqualTo("Dell XPS 15");
assertThat((String) response.path("status")).isEqualTo("AVAILABLE");
assertThat(((Number) response.path("organizationId")).longValue()).isEqualTo(organizacao.getId());
assertThat(((Number) response.path("unitId")).longValue()).isEqualTo(unidade.getId());

}

@Test
@Story("Criação de ativo")
@Severity(SeverityLevel.CRITICAL)
@DisplayName("GESTOR cria ativo na sua unidade — retorna 201")
void gestorCriaAtivoNaSuaUnidade() {
String token = loginComoGestor();


MockMvcResponse response =
    apiClient.criarAtivo(
        organizacao.getId(), "ASSET-E2E-002", AssetType.DESKTOP, "HP EliteDesk",
        unidade.getId(), token);

assertThat(response.statusCode()).isEqualTo(201);

}

@Test
@Story("Validação de duplicidade")
@Severity(SeverityLevel.NORMAL)
@DisplayName("Criação com assetTag duplicado retorna 400")
void assetTagDuplicadoRetorna400() {
criarAtivo("ASSET-DUPL");
String token = loginComoAdmin();


MockMvcResponse response =
    apiClient.criarAtivo(
        organizacao.getId(), "ASSET-DUPL", AssetType.NOTEBOOK, "Qualquer Modelo",
        unidade.getId(), token);

assertThat(response.statusCode()).isEqualTo(400);

}

@Test
@Story("Validação de dados")
@Severity(SeverityLevel.NORMAL)
@DisplayName("Body com campos em branco retorna 400 com detalhes dos campos inválidos")
void camposEmBrancoRetorna400() {
String token = loginComoAdmin();
MockMvcResponse response = apiClient.criarAtivoComDadosInvalidos(organizacao.getId(), token);


assertThat(response.statusCode()).isEqualTo(400);
String body = response.getBody().asString();
assertThat(body).containsIgnoringCase("assetTag").doesNotContain("500");

}

@Test
@Story("Controle de acesso")
@Severity(SeverityLevel.CRITICAL)
@DisplayName("OPERADOR não pode criar ativo — retorna 403")
void operadorNaoPodeCriarAtivo() {
String token = loginComoOperador();

MockMvcResponse response =
    apiClient.criarAtivo(
        organizacao.getId(), "ASSET-OP", AssetType.NOTEBOOK, "Modelo", unidade.getId(),
        token);

assertThat(response.statusCode()).isEqualTo(403);
  }

  @Test
  @Story("Controle de acesso")
  @Severity(SeverityLevel.BLOCKER)
  @DisplayName("Criação sem autenticação retorna 401")
  void criarSemAutenticacaoRetorna401() {
    MockMvcResponse response =
        given()
            .contentType(ContentType.JSON)
            .body(
                Map.of(
                    "assetTag", "ASSET-NOAUTH",
                    "type", "NOTEBOOK",
                    "model", "Qualquer",
                    "unitId", unidade.getId()))
            .when()
            .post("/assets/{orgId}", String.valueOf(organizacao.getId()))
            .then()
            .extract()
            .response();

    assertThat(response.statusCode()).isEqualTo(401);
  }
}
