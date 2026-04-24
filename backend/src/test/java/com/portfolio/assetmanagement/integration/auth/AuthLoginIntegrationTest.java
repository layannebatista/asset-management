package com.portfolio.assetmanagement.integration.auth;

import static org.assertj.core.api.Assertions.assertThat;

import com.portfolio.assetmanagement.integration.BaseIntegrationTest;
import com.portfolio.assetmanagement.security.enums.UserRole;
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
@Feature("Integração — Auth")
@Story("Login")
@DisplayName("Auth — Login")
@Tag("testType=Integration")
@Tag("module=Auth")
class AuthLoginIntegrationTest extends BaseIntegrationTest {

  @Test
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("AL01 - Login com credenciais válidas retorna tokens e metadados do usuário")
  void al01LoginValidoRetornaTokens() {
    MockMvcResponse response = apiClient.login("admin@test.com", "Senha@123");

    assertThat(response.statusCode()).isEqualTo(200);
    assertThat((String) response.path("accessToken")).isNotBlank();
    assertThat((String) response.path("refreshToken")).isNotBlank();
    assertThat((String) response.path("tokenType")).isEqualTo("Bearer");
    assertThat((String) response.path("email")).isEqualTo("admin@test.com");
    assertThat((String) response.path("role")).isEqualTo(UserRole.ADMIN.name());
  }

  @Test
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("AL02 - Login com senha inválida retorna 401")
  void al02LoginSenhaErradaRetorna401() {
    MockMvcResponse response = apiClient.login("admin@test.com", "SenhaErrada!");

    assertThat(response.statusCode()).isEqualTo(401);
  }

  @Test
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("AL03 - Login com email inexistente retorna 401")
  void al03LoginEmailInexistenteRetorna401() {
    MockMvcResponse response = apiClient.login("naoexiste@test.com", "Senha@123");

    assertThat(response.statusCode()).isEqualTo(401);
  }

  @Test
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("AL04 - Login com formato de email inválido retorna 400")
  void al04LoginComEmailInvalidoRetorna400() {
    MockMvcResponse response = apiClient.login("email-invalido", "Senha@123");

    assertThat(response.statusCode()).isEqualTo(400);
  }

  @Test
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("AL05 - Login com senha em branco retorna 400")
  void al05LoginComSenhaEmBrancoRetorna400() {
    MockMvcResponse response = apiClient.login("admin@test.com", "   ");

    assertThat(response.statusCode()).isEqualTo(400);
  }

  @Test
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("AL06 - Login de usuário com telefone retorna challenge MFA")
  void al06LoginComTelefoneRetornaChallengeMfa() {
    var user =
        testDataHelper.criarUsuarioComTelefone(
            "admin-mfa@test.com",
            "Senha@123",
            UserRole.ADMIN,
            organizacao,
            unidade,
            "5511999999999");

    MockMvcResponse response = apiClient.login("admin-mfa@test.com", "Senha@123");

    assertThat(response.statusCode()).isEqualTo(200);
    assertThat((Boolean) response.path("mfaRequired")).isTrue();
    assertThat(((Number) response.path("userId")).longValue()).isEqualTo(user.getId());
    assertThat((String) response.path("accessToken")).isNull();
    assertThat((String) response.path("refreshToken")).isNull();
  }
}