package com.portfolio.assetmanagement.integration.auth;

import static org.assertj.core.api.Assertions.assertThat;

import com.portfolio.assetmanagement.integration.BaseIntegrationTest;
import com.portfolio.assetmanagement.domain.user.enums.UserStatus;
import com.portfolio.assetmanagement.infrastructure.persistence.user.repository.UserRepository;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import io.qameta.allure.Story;
import io.restassured.module.mockmvc.response.MockMvcResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

@Epic("Backend")
@Feature("Integração — Auth")
@Story("Sessão")
@DisplayName("Auth — Sessão")
class AuthSessionIntegrationTest extends BaseIntegrationTest {

  @Autowired private UserRepository userRepository;

  @Test
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("AS01 - Refresh token válido retorna novos tokens")
  void as01RefreshTokenValidoRetornaNovosTokens() {
    MockMvcResponse loginResponse = apiClient.login("admin@test.com", "Senha@123");
    String refreshToken = loginResponse.path("refreshToken");

    MockMvcResponse response = apiClient.refresh(refreshToken);

    assertThat(response.statusCode()).isEqualTo(200);
    assertThat((String) response.path("accessToken")).isNotBlank();
    assertThat((String) response.path("refreshToken")).isNotBlank();
    assertThat((String) response.path("refreshToken")).isNotEqualTo(refreshToken);
  }

  @Test
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("AS02 - Refresh com token inválido retorna 400")
  void as02RefreshComTokenInvalidoRetorna400() {
    MockMvcResponse response = apiClient.refresh("refresh-invalido");

    assertThat(response.statusCode()).isEqualTo(400);
  }

  @Test
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("AS03 - Refresh sem token retorna 400")
  void as03RefreshSemTokenRetorna400() {
    MockMvcResponse response = apiClient.refreshSemCorpo();

    assertThat(response.statusCode()).isEqualTo(400);
  }

  @Test
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("AS04 - Logout autenticado retorna 204")
  void as04LogoutAutenticadoRetorna204() {
    String accessToken = loginComoAdmin();

    MockMvcResponse response = apiClient.logout(accessToken);

    assertThat(response.statusCode()).isEqualTo(204);
  }

  @Test
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("AS05 - Logout revoga refresh tokens do usuário")
  void as05LogoutRevogaRefreshTokens() {
    MockMvcResponse loginResponse = apiClient.login("admin@test.com", "Senha@123");
    String accessToken = loginResponse.path("accessToken");
    String refreshToken = loginResponse.path("refreshToken");

    MockMvcResponse logoutResponse = apiClient.logout(accessToken);
    MockMvcResponse refreshResponse = apiClient.refresh(refreshToken);

    assertThat(logoutResponse.statusCode()).isEqualTo(204);
    assertThat(refreshResponse.statusCode()).isEqualTo(400);
  }

  @Test
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("AS06 - Logout não revoga o access token atual imediatamente")
  void as06LogoutNaoRevogaAccessTokenAtualImediatamente() {
    MockMvcResponse loginResponse = apiClient.login("admin@test.com", "Senha@123");
    String accessToken = loginResponse.path("accessToken");

    MockMvcResponse logoutResponse = apiClient.logout(accessToken);
    MockMvcResponse assetsResponse = apiClient.listarAtivos(accessToken);

    assertThat(logoutResponse.statusCode()).isEqualTo(204);
    assertThat(assetsResponse.statusCode()).isEqualTo(200);
  }

  @Test
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("AS07 - Refresh token de usuário desativado retorna 400")
  void as07RefreshTokenDeUsuarioDesativadoRetorna400() {
    // Obtém um refresh token válido antes de desativar o usuário
    MockMvcResponse loginResponse = apiClient.login("admin@test.com", "Senha@123");
    String refreshToken = loginResponse.path("refreshToken");

    // Desativa o usuário diretamente no banco (bypass de service)
    admin.inactivate();
    userRepository.save(admin);

    // Tenta usar o refresh token — deve ser rejeitado pois o usuário não está mais ACTIVE
    MockMvcResponse response = apiClient.refresh(refreshToken);

    assertThat(response.statusCode()).isEqualTo(400);
  }
}