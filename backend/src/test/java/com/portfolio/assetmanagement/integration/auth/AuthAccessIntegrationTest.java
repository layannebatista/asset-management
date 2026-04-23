package com.portfolio.assetmanagement.integration.auth;

import static org.assertj.core.api.Assertions.assertThat;

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
@Feature("Integração — Auth")
@Story("Proteção de endpoints")
@DisplayName("Auth — Proteção e Acesso")
class AuthAccessIntegrationTest extends BaseIntegrationTest {

  @Test
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("AA01 - Endpoint protegido sem token retorna 401 em GET /assets")
  void aa01SemTokenEmAssetsRetorna401() {
    MockMvcResponse response = apiClient.getSemToken("/assets");

    assertThat(response.statusCode()).isEqualTo(401);
  }

  @Test
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("AA02 - Endpoint protegido sem token retorna 401 em GET /assets/{id}")
  void aa02SemTokenEmBuscaPorIdRetorna401() {
    MockMvcResponse response = apiClient.getSemToken("/assets/1");

    assertThat(response.statusCode()).isEqualTo(401);
  }

  @Test
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("AA03 - Token inválido retorna 401")
  void aa03TokenInvalidoRetorna401() {
    MockMvcResponse response = apiClient.listarAtivos("token-invalido-nao-assinado");

    assertThat(response.statusCode()).isEqualTo(401);
  }

  @Test
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("AA04 - ADMIN acessa listagem de ativos com sucesso")
  void aa04AdminAcessaAtivos() {
    MockMvcResponse response = apiClient.listarAtivos(loginComoAdmin());

    assertThat(response.statusCode()).isEqualTo(200);
  }

  @Test
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("AA05 - GESTOR acessa listagem de ativos com sucesso")
  void aa05GestorAcessaAtivos() {
    MockMvcResponse response = apiClient.listarAtivos(loginComoGestor());

    assertThat(response.statusCode()).isEqualTo(200);
  }

  @Test
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("AA06 - OPERADOR acessa listagem de ativos com sucesso")
  void aa06OperadorAcessaAtivos() {
    MockMvcResponse response = apiClient.listarAtivos(loginComoOperador());

    assertThat(response.statusCode()).isEqualTo(200);
  }

  @Test
  @Severity(SeverityLevel.BLOCKER)
  @DisplayName("AA07 - JWT com algoritmo \"none\" é rejeitado com 401")
  void aa07JwtComAlgoritmoNoneRetorna401() {
    // JWT montado manualmente com alg:none — sem assinatura
    String jwtAlgNone = "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0"
        + ".eyJzdWIiOiJhZG1pbkB0ZXN0LmNvbSIsImV4cCI6OTk5OTk5OTk5OX0"
        + ".";

    MockMvcResponse response = apiClient.listarAtivos(jwtAlgNone);

    assertThat(response.statusCode()).isEqualTo(401);
  }

  @Test
  @Severity(SeverityLevel.BLOCKER)
  @DisplayName("AA08 - JWT com payload adulterado (assinatura inválida) retorna 401")
  void aa08JwtComPayloadAdulteradoRetorna401() {
    // Header real de HS256, payload adulterado com role elevada, assinatura forjada
    String jwtTampered = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
        + ".eyJzdWIiOiJhZG1pbkBmb3JnZWQuY29tIiwicm9sZSI6IkFETUlOIiwiZXhwIjo5OTk5OTk5OTk5fQ"
        + ".invalidsignatureXXXXXXXXXXXXXXXX";

    MockMvcResponse response = apiClient.listarAtivos(jwtTampered);

    assertThat(response.statusCode()).isEqualTo(401);
  }
}