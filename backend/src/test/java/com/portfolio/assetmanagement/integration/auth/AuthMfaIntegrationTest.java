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
@Story("MFA")
@DisplayName("Auth — MFA")
@Tag("testType=Integration")
@Tag("module=Auth")
class AuthMfaIntegrationTest extends BaseIntegrationTest {

  private Long criarUsuarioComMfaEObterUserId() {
    testDataHelper.criarUsuarioComTelefone(
        "gestor-mfa@test.com",
        "Senha@123",
        UserRole.GESTOR,
        organizacao,
        unidade,
        "5511988887777");

    MockMvcResponse loginResponse = apiClient.login("gestor-mfa@test.com", "Senha@123");
    return ((Number) loginResponse.path("userId")).longValue();
  }

  @Test
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("AM01 - Verificação MFA com código válido retorna tokens")
  void am01VerifyMfaComCodigoValidoRetornaTokens() {
    Long userId = criarUsuarioComMfaEObterUserId();
    String code = testDataHelper.obterCodigoMfaValido(userId);

    MockMvcResponse response = apiClient.verifyMfa(userId, code);

    assertThat(response.statusCode()).isEqualTo(200);
    assertThat((String) response.path("accessToken")).isNotBlank();
    assertThat((String) response.path("refreshToken")).isNotBlank();
    assertThat((Boolean) response.path("mfaRequired")).isFalse();
  }

  @Test
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("AM02 - Verificação MFA com código inválido retorna 400")
  void am02VerifyMfaComCodigoInvalidoRetorna400() {
    Long userId = criarUsuarioComMfaEObterUserId();

    MockMvcResponse response = apiClient.verifyMfa(userId, "000000");

    assertThat(response.statusCode()).isEqualTo(400);
  }

  @Test
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("AM03 - Verificação MFA sem código retorna 400")
  void am03VerifyMfaSemCodigoRetorna400() {
    Long userId = criarUsuarioComMfaEObterUserId();

    MockMvcResponse response = apiClient.verifyMfaSemCode(userId);

    assertThat(response.statusCode()).isEqualTo(400);
  }

  @Test
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("AM04 - Verificação MFA sem userId retorna 400")
  void am04VerifyMfaSemUserIdRetorna400() {
    Long userId = criarUsuarioComMfaEObterUserId();
    String code = testDataHelper.obterCodigoMfaValido(userId);

    MockMvcResponse response = apiClient.verifyMfaSemUserId(code);

    assertThat(response.statusCode()).isEqualTo(400);
  }

  @Test
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("AM05 - Código MFA reutilizado retorna 400")
  void am05CodigoMfaReutilizadoRetorna400() {
    Long userId = criarUsuarioComMfaEObterUserId();
    String code = testDataHelper.obterCodigoMfaValido(userId);

    MockMvcResponse primeiraResposta = apiClient.verifyMfa(userId, code);
    MockMvcResponse segundaResposta = apiClient.verifyMfa(userId, code);

    assertThat(primeiraResposta.statusCode()).isEqualTo(200);
    assertThat(segundaResposta.statusCode()).isEqualTo(400);
  }
}