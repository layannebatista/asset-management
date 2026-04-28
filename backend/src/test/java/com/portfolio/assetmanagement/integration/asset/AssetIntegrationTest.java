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
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

@Epic("Backend")
@Feature("Integração — Assets")
@DisplayName("Assets — Ciclo de Vida Completo")
@Tag("testType=Integration")
@Tag("module=Asset")
class AssetIntegrationTest extends BaseIntegrationTest {

  // =========================================================
  // LISTAGEM
  // =========================================================

  @Nested
  @Story("Listagem de ativos")
  @DisplayName("Listagem de ativos")
  class Listagem {

    @Test
    @Severity(SeverityLevel.CRITICAL)
    @DisplayName("[INTEGRACAO][ASSET] ADMIN lista ativos da organização com sucesso")
    void adminListaAtivos() {
      criarAtivo("ASSET-INT-001");
      String token = loginComoAdmin();

      MockMvcResponse response = apiClient.listarAtivos(token);

      assertThat(response.statusCode()).isEqualTo(200);
      assertThat((String) response.path("content[0].assetTag")).isNotBlank();
    }

    @Test
    @Severity(SeverityLevel.CRITICAL)
    @DisplayName("[INTEGRACAO][ASSET] GESTOR vê apenas ativos da sua unidade")
    void gestorListaAtivosDaSuaUnidade() {
      criarAtivo("ASSET-INT-002");
      String token = loginComoGestor();

      MockMvcResponse response = apiClient.listarAtivos(token);

      assertThat(response.statusCode()).isEqualTo(200);
      assertThat((Integer) response.path("totalElements")).isEqualTo(1);
      assertThat((String) response.path("content[0].assetTag")).isEqualTo("ASSET-INT-002");
    }

    @Test
    @Severity(SeverityLevel.CRITICAL)
    @DisplayName("[INTEGRACAO][ASSET] Listagem sem autenticação retorna 401")
    void semTokenRetorna401() {
      MockMvcResponse response = apiClient.getSemToken("/assets");
      assertThat(response.statusCode()).isEqualTo(401);
    }
  }

  // =========================================================
  // BUSCA POR ID
  // =========================================================

  @Nested
  @Story("Busca por ID")
  @DisplayName("Busca por ID")
  class BuscaPorId {

    @Test
    @Severity(SeverityLevel.CRITICAL)
    @DisplayName("[INTEGRACAO][ASSET] ADMIN busca ativo existente — retorna 200 com assetTag")
    void adminBuscaAtivoExistente() {
      Asset ativo = criarAtivo("ASSET-INT-003");
      String token = loginComoAdmin();

      MockMvcResponse response = apiClient.buscarAtivo(ativo.getId(), token);

      assertThat(response.statusCode()).isEqualTo(200);
      assertThat((String) response.path("assetTag")).isEqualTo("ASSET-INT-003");
    }

    @Test
    @Severity(SeverityLevel.NORMAL)
    @DisplayName("[INTEGRACAO][ASSET] Deve retornar 404 se ativo não existir")
    void retorna404QuandoNaoEncontrado() {
      String token = loginComoAdmin();
      MockMvcResponse response = apiClient.buscarAtivo(99999L, token);
      assertThat(response.statusCode()).isEqualTo(404);
    }

    @Test
    @Severity(SeverityLevel.CRITICAL)
    @DisplayName("[INTEGRACAO][ASSET] Busca sem autenticação retorna 401")
    void semTokenRetorna401() {
      MockMvcResponse response = apiClient.getSemToken("/assets/1");
      assertThat(response.statusCode()).isEqualTo(401);
    }
  }

  // =========================================================
  // CRIAÇÃO
  // =========================================================

  @Nested
  @Story("Criação de ativo")
  @DisplayName("Criação de ativos")
  class Criacao {

    @Test
    @Severity(SeverityLevel.CRITICAL)
    @DisplayName("[INTEGRACAO][ASSET] ADMIN cria ativo com sucesso — retorna 201 com assetTag")
    void adminCriaAtivo() {
      String token = loginComoAdmin();

      MockMvcResponse response =
          apiClient.criarAtivo(
              organizacao.getId(),
              "ASSET-NEW-001",
              com.portfolio.assetmanagement.domain.asset.enums.AssetType.NOTEBOOK,
              "Dell Latitude",
              unidade.getId(),
              token);

      assertThat(response.statusCode()).isEqualTo(201);
      assertThat((String) response.path("assetTag")).isEqualTo("ASSET-NEW-001");
      assertThat((String) response.path("status")).isEqualTo("AVAILABLE");
    }

    @Test
    @Severity(SeverityLevel.NORMAL)
    @DisplayName("[INTEGRACAO][ASSET] Deve retornar 400 quando validação falhar")
    void retorna400ComDadosInvalidos() {
      String token = loginComoAdmin();
      MockMvcResponse response = apiClient.criarAtivoComDadosInvalidos(organizacao.getId(), token);
      assertThat(response.statusCode()).isEqualTo(400);
    }

    @Test
    @Severity(SeverityLevel.CRITICAL)
    @DisplayName("[INTEGRACAO][ASSET] OPERADOR não deve criar asset — retorna 403")
    void operadorNaoPodeCriarAtivo() {
      String token = loginComoOperador();
      MockMvcResponse response =
          apiClient.criarAtivo(
              organizacao.getId(),
              "ASSET-OP",
              com.portfolio.assetmanagement.domain.asset.enums.AssetType.NOTEBOOK,
              "Modelo",
              unidade.getId(),
              token);
      assertThat(response.statusCode()).isEqualTo(403);
    }
  }

  // =========================================================
  // APOSENTADORIA
  // =========================================================

  @Nested
  @Story("Aposentadoria de ativo")
  @DisplayName("Aposentadoria de ativos")
  class Aposentadoria {

    @Test
    @Severity(SeverityLevel.CRITICAL)
    @DisplayName("[INTEGRACAO][ASSET] ADMIN aposta ativo com sucesso — retorna 200")
    void adminAposentaAtivo() {
      Asset ativo = criarAtivo("ASSET-RET-001");
      String token = loginComoAdmin();

      MockMvcResponse response = apiClient.aposentarAtivo(ativo.getId(), token);
      assertThat(response.statusCode()).isEqualTo(200);
    }

    @Test
    @Severity(SeverityLevel.CRITICAL)
    @DisplayName("[INTEGRACAO][ASSET] GESTOR não pode aposentar — retorna 403")
    void gestorNaoPodeAposentar() {
      Asset ativo = criarAtivo("ASSET-RET-002");
      String token = loginComoGestor();

      MockMvcResponse response = apiClient.aposentarAtivo(ativo.getId(), token);
      assertThat(response.statusCode()).isEqualTo(403);
    }

    @Test
    @Severity(SeverityLevel.CRITICAL)
    @DisplayName("[INTEGRACAO][ASSET] User não pode aposentar ativo — retorna 403")
    void operadorNaoPodeAposentar() {
      Asset ativo = criarAtivo("ASSET-RET-003");
      String token = loginComoOperador();

      MockMvcResponse response = apiClient.aposentarAtivo(ativo.getId(), token);
      assertThat(response.statusCode()).isEqualTo(403);
    }
  }

  // =========================================================
  // ATRIBUIÇÃO
  // =========================================================

  @Nested
  @Story("Atribuição de ativo")
  @DisplayName("Atribuição de ativos")
  class Atribuicao {

    @Test
    @Severity(SeverityLevel.CRITICAL)
    @DisplayName("[INTEGRACAO][ASSET] User não pode atribuir ativo — retorna 403")
    void operadorNaoPodeAtribuirAtivo() {
      Asset ativo = criarAtivo("ASSET-ASSIGN-001");
      String token = loginComoOperador();

      MockMvcResponse response = apiClient.atribuirAtivo(ativo.getId(), operador.getId(), token);
      assertThat(response.statusCode()).isEqualTo(403);
    }

    @Test
    @Severity(SeverityLevel.CRITICAL)
    @DisplayName("[INTEGRACAO][ASSET] ADMIN atribui ativo ao operador com sucesso")
    void adminAtribuiAtivo() {
      Asset ativo = criarAtivo("ASSET-ASSIGN-002");
      String token = loginComoAdmin();

      MockMvcResponse response = apiClient.atribuirAtivo(ativo.getId(), operador.getId(), token);
      assertThat(response.statusCode()).isEqualTo(200);
    }
  }
}
