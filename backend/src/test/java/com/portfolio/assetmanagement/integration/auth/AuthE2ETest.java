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
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

@Epic("Backend")
@Feature("Integração — Autenticação")
@DisplayName("Autenticação e Autorização")
class AuthE2ETest extends BaseIntegrationTest {

  @Nested
  @Story("Login")
  @DisplayName("Login")
  class Login {

    @Test
    @Severity(SeverityLevel.CRITICAL)
    @DisplayName("Login com credenciais válidas retorna 200 e accessToken")
    void loginValido() {
      MockMvcResponse response = apiClient.login("admin@test.com", "Senha@123");

      assertThat(response.statusCode()).isEqualTo(200);
      assertThat((String) response.path("accessToken")).isNotBlank();
      assertThat((String) response.path("refreshToken")).isNotBlank();
    }

    @Test
    @Severity(SeverityLevel.NORMAL)
    @DisplayName("Login com senha errada retorna 401")
    void loginSenhaErrada() {
      MockMvcResponse response = apiClient.login("admin@test.com", "SenhaErrada!");
      assertThat(response.statusCode()).isEqualTo(401);
    }

    @Test
    @Severity(SeverityLevel.NORMAL)
    @DisplayName("Login com email inexistente retorna 401")
    void loginEmailInexistente() {
      MockMvcResponse response = apiClient.login("naoexiste@test.com", "Senha@123");
      assertThat(response.statusCode()).isEqualTo(401);
    }

    @Test
    @Severity(SeverityLevel.CRITICAL)
    @DisplayName("Refresh token válido retorna novos tokens")
    void refreshTokenValido() {
      MockMvcResponse login = apiClient.login("admin@test.com", "Senha@123");
      String refreshToken = login.path("refreshToken");

      MockMvcResponse response = apiClient.refresh(refreshToken);

      assertThat(response.statusCode()).isEqualTo(200);
      assertThat((String) response.path("accessToken")).isNotBlank();
      assertThat((String) response.path("refreshToken")).isNotBlank();
      assertThat((String) response.path("refreshToken")).isNotEqualTo(refreshToken);
    }

    @Test
    @Severity(SeverityLevel.CRITICAL)
    @DisplayName("Logout revoga refresh tokens do usuário")
    void logoutRevogaRefreshTokens() {
      MockMvcResponse login = apiClient.login("admin@test.com", "Senha@123");
      String accessToken = login.path("accessToken");
      String refreshToken = login.path("refreshToken");

      MockMvcResponse logoutResponse = apiClient.logout(accessToken);
      assertThat(logoutResponse.statusCode()).isEqualTo(204);

      MockMvcResponse refreshResponse = apiClient.refresh(refreshToken);
      assertThat(refreshResponse.statusCode()).isEqualTo(400);
    }
  }

  @Nested
  @Story("Proteção de endpoints")
  @DisplayName("Proteção de endpoints")
  class ProtecaoDeEndpoints {

    @Test
    @Severity(SeverityLevel.CRITICAL)
    @DisplayName("Deve retornar 401 sem autenticação — GET /assets")
    void semTokenListagemRetorna401() {
      MockMvcResponse response = apiClient.getSemToken("/assets");
      assertThat(response.statusCode()).isEqualTo(401);
    }

    @Test
    @Severity(SeverityLevel.CRITICAL)
    @DisplayName("Sem autenticação deve retornar 401 — GET /assets/{id}")
    void semTokenBuscaRetorna401() {
      MockMvcResponse response = apiClient.getSemToken("/assets/1");
      assertThat(response.statusCode()).isEqualTo(401);
    }

    @Test
    @Severity(SeverityLevel.CRITICAL)
    @DisplayName("Token inválido retorna 401")
    void tokenInvalidoRetorna401() {
      MockMvcResponse response = apiClient.listarAtivos("token-invalido-nao-assinado");
      assertThat(response.statusCode()).isEqualTo(401);
    }
  }

  @Nested
  @Story("Controle de acesso por perfil")
  @DisplayName("Controle de acesso por perfil")
  class ControleDeAcesso {

    @Test
    @Severity(SeverityLevel.CRITICAL)
    @DisplayName("ADMIN acessa listagem de ativos — 200")
    void adminAcessaAtivos() {
      String token = loginComoAdmin();
      MockMvcResponse response = apiClient.listarAtivos(token);
      assertThat(response.statusCode()).isEqualTo(200);
    }

    @Test
    @Severity(SeverityLevel.CRITICAL)
    @DisplayName("GESTOR acessa listagem de ativos — 200")
    void gestorAcessaAtivos() {
      String token = loginComoGestor();
      MockMvcResponse response = apiClient.listarAtivos(token);
      assertThat(response.statusCode()).isEqualTo(200);
    }

    @Test
    @Severity(SeverityLevel.NORMAL)
    @DisplayName("OPERADOR acessa listagem de ativos — 200")
    void operadorAcessaAtivos() {
      String token = loginComoOperador();
      MockMvcResponse response = apiClient.listarAtivos(token);
      assertThat(response.statusCode()).isEqualTo(200);
    }
  }
}
