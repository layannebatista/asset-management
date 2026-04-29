package com.portfolio.assetmanagement.bdd.steps.auth;

import static org.assertj.core.api.Assertions.assertThat;

import com.portfolio.assetmanagement.bdd.client.ApiClient;
import com.portfolio.assetmanagement.bdd.context.ScenarioContext;
import io.cucumber.java.pt.Então;
import io.cucumber.java.pt.Quando;
import io.restassured.module.mockmvc.response.MockMvcResponse;
import org.springframework.beans.factory.annotation.Autowired;

/** Steps de ações relacionadas a refresh token e logout. */
public class AuthRefreshSteps {

  @Autowired private ApiClient apiClient;
  @Autowired private ScenarioContext context;
  @Autowired private AuthStepsContext authContext;

  // =========================================================
  // AÇÕES — REFRESH TOKEN
  // =========================================================

  @Quando("renovo a sessão com o refresh token salvo")
  public void renovoASessaoComORefreshTokenSalvo() {
    String refreshToken = authContext.getRefreshToken();
    MockMvcResponse response = apiClient.refresh(refreshToken);
    setLastResponse(response);

    if (response.statusCode() == 200) {
      String newRefreshToken = response.path("refreshToken");
      authContext.setRefreshToken(newRefreshToken);
    }
  }

  @Quando("renovo a sessão novamente com o refresh token anterior")
  public void renovoASessaoNovamenteComORefreshTokenAnterior() {
    String previousRefreshToken = authContext.getPreviousRefreshToken();
    setLastResponse(apiClient.refresh(previousRefreshToken));
  }

  @Quando("renovo a sessão com o refresh token secundário salvo")
  public void renovoASessaoComORefreshTokenSecundarioSalvo() {
    String secondaryRefreshToken = authContext.getSecondaryRefreshToken();
    setLastResponse(apiClient.refresh(secondaryRefreshToken));
  }

  @Quando("renovo a sessão com token inválido {string}")
  public void renovoASessaoComTokenInvalido(String tokenInvalido) {
    MockMvcResponse response = apiClient.refresh(tokenInvalido);
    setLastResponse(response);
  }

  @Quando("renovo a sessão sem enviar token")
  public void renovoASessaoSemEnviarToken() {
    MockMvcResponse response = apiClient.refreshSemCorpo();
    setLastResponse(response);
  }

  // =========================================================
  // AÇÕES — LOGOUT
  // =========================================================

  @Quando("faço logout com o token de acesso salvo")
  public void facoLogoutComOTokenDeAcessoSalvo() {
    MockMvcResponse response = apiClient.logout(context.getToken());
    setLastResponse(response);
  }

  @Quando("faço logout sem autenticação")
  public void facoLogoutSemAutenticacao() {
    MockMvcResponse response = apiClient.logoutSemToken();
    setLastResponse(response);
  }

  // =========================================================
  // AÇÕES — RATE LIMIT DE REFRESH
  // =========================================================

  @Quando(
      "renovo a sessão com token inválido {string} a partir do IP {string} por {int} tentativas")
  public void renovoSessaoComMesmoIpPorTentativas(String token, String ip, int tentativas) {
    setLastResponse(executarTentativasRefresh(token, ip, tentativas));
  }

  // =========================================================
  // VERIFICAÇÕES
  // =========================================================

  @Então("o novo refresh token deve ser diferente do anterior")
  public void oNovoRefreshTokenDeveSerDiferenteDoAnterior() {
    String refreshToken = authContext.getRefreshToken();
    String previousRefreshToken = authContext.getPreviousRefreshToken();

    assertThat(refreshToken)
        .as("O refresh token novo nao foi capturado apos o refresh")
        .isNotBlank()
        .isNotEqualTo(previousRefreshToken);
  }

  // =========================================================
  // HELPERS INTERNOS
  // =========================================================

  private void setLastResponse(MockMvcResponse response) {
    context.setLastResponse(response);
  }

  private MockMvcResponse executarTentativasRefresh(String token, String ip, int tentativas) {
    MockMvcResponse response = null;
    for (int attempt = 0; attempt < tentativas; attempt++) {
      response = apiClient.refreshComIp(token, ip);
    }
    return response;
  }
}
