package com.portfolio.assetmanagement.bdd.steps.auth;

import com.portfolio.assetmanagement.bdd.client.ApiClient;
import com.portfolio.assetmanagement.bdd.context.ScenarioContext;
import io.cucumber.java.pt.Dado;
import io.cucumber.java.pt.Quando;
import io.restassured.module.mockmvc.response.MockMvcResponse;
import org.springframework.beans.factory.annotation.Autowired;

/** Steps de ações relacionadas a login e rate-limiting. */
public class AuthLoginSteps {

  @Autowired private ApiClient apiClient;
  @Autowired private ScenarioContext context;
  @Autowired private AuthStepsContext authContext;

  // =========================================================
  // AÇÕES — LOGIN
  // =========================================================

  @Dado("que realizei login com email {string} e senha {string}")
  @Quando("realizo login com email {string} e senha {string}")
  public void realizoLoginComEmailESenha(String email, String senha) {
    MockMvcResponse response = apiClient.login(email, senha);
    setLastResponse(response);

    if (response.statusCode() == 200) {
      String accessToken = response.path("accessToken");
      if (accessToken != null && !accessToken.isBlank()) {
        context.setToken(accessToken);
      }
    }
  }

  // =========================================================
  // AÇÕES — RATE LIMIT DE LOGIN
  // =========================================================

  @Quando(
      "realizo login com email {string} e senha {string} a partir do IP {string} por {int} tentativas")
  public void realizoLoginComMesmoIpPorTentativas(
      String email, String senha, String ip, int tentativas) {
    setLastResponse(executarTentativasLogin(email, senha, ip, tentativas));
  }

  // =========================================================
  // HELPERS INTERNOS
  // =========================================================

  private void setLastResponse(MockMvcResponse response) {
    context.setLastResponse(response);
  }

  private MockMvcResponse executarTentativasLogin(
      String email, String senha, String ip, int tentativas) {
    MockMvcResponse response = null;
    for (int attempt = 0; attempt < tentativas; attempt++) {
      response = apiClient.loginComIp(email, senha, ip);
    }
    return response;
  }
}
