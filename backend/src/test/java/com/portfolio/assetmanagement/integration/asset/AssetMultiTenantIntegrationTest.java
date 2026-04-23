package com.portfolio.assetmanagement.integration.asset;

import static org.assertj.core.api.Assertions.assertThat;

import com.portfolio.assetmanagement.domain.asset.entity.Asset;
import com.portfolio.assetmanagement.domain.asset.enums.AssetType;
import com.portfolio.assetmanagement.domain.organization.entity.Organization;
import com.portfolio.assetmanagement.domain.unit.entity.Unit;
import com.portfolio.assetmanagement.integration.BaseIntegrationTest;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import io.qameta.allure.Story;
import io.restassured.module.mockmvc.response.MockMvcResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@Epic("Backend")
@Feature("Integração — Assets")
@DisplayName("Isolamento Multi-Organização")
class AssetMultiTenantIntegrationTest extends BaseIntegrationTest {

  @Test
  @Story("Isolamento multi-tenant")
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("ADMIN vê apenas ativos da sua organização — isolamento entre orgs")
  void adminNaoVeAtivosDeOutraOrganizacao() {
    // Cria ativo na organização principal (Tech Corp)
    criarAtivo("ORG-A-ASSET-001");

    // Cria segunda organização com ativo próprio
    Organization outraOrg = testDataHelper.criarOrganizacao("Outra Corp");
    Unit outraUnidade = testDataHelper.criarUnidade("Filial", outraOrg);
    testDataHelper.criarAdmin("admin@outra.com", "Senha@123", outraOrg, outraUnidade);
    testDataHelper.criarAtivo("ORG-B-ASSET-001", AssetType.NOTEBOOK, outraOrg, outraUnidade);

    // Admin da Tech Corp só deve ver ativos da Tech Corp
    String token = loginComoAdmin();
    MockMvcResponse response = apiClient.listarAtivos(token);

    assertThat(response.statusCode()).isEqualTo(200);

    // Verifica que nenhum ativo da outra organização aparece
    Integer total = response.path("totalElements");
    assertThat(total).isGreaterThanOrEqualTo(1);

    // Verifica que o assetTag da outra organização não está na lista
    String body = response.getBody().asString();
    assertThat(body).doesNotContain("ORG-B-ASSET-001");
  }

  @Test
  @Story("Isolamento multi-tenant")
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("GESTOR vê apenas ativos da sua unidade")
  void gestorVeApenasAtivosDaSuaUnidade() {
    criarAtivo("UNIT-A-ASSET-001");

    // Cria segunda unidade na mesma organização com ativo próprio
    Unit outraUnidade = testDataHelper.criarUnidade("Filial SP", organizacao);
    testDataHelper.criarAtivo("UNIT-B-ASSET-001", AssetType.DESKTOP, organizacao, outraUnidade);

    // GESTOR da unidade "Sede" só vê ativos de "Sede"
    String token = loginComoGestor();
    MockMvcResponse response = apiClient.listarAtivos(token);

    assertThat(response.statusCode()).isEqualTo(200);
    assertThat((Integer) response.path("totalElements")).isEqualTo(1);
    assertThat((String) response.path("content[0].assetTag")).isEqualTo("UNIT-A-ASSET-001");
  }

  @Test
  @Story("Controle de acesso")
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("GESTOR não pode ver ativo de outra unidade por ID — retorna 403")
  void gestorNaoPodeVerAtivoDeOutraUnidade() {
    Unit outraUnidade = testDataHelper.criarUnidade("Filial RJ", organizacao);
    Asset ativoOutraUnidade =
        testDataHelper.criarAtivo("OTHER-UNIT-ASSET", AssetType.NOTEBOOK, organizacao, outraUnidade);

    String token = loginComoGestor(); // GESTOR da unidade "Sede"
    MockMvcResponse response = apiClient.buscarAtivo(ativoOutraUnidade.getId(), token);

    // GESTOR não tem acesso a ativos de outras unidades
    assertThat(response.statusCode()).isEqualTo(403);
  }
}
