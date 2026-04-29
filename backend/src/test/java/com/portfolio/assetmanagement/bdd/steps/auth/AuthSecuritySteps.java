package com.portfolio.assetmanagement.bdd.steps.auth;

import static org.assertj.core.api.Assertions.assertThat;

import com.portfolio.assetmanagement.bdd.client.ApiClient;
import com.portfolio.assetmanagement.bdd.context.ScenarioContext;
import io.cucumber.java.pt.E;
import io.cucumber.java.pt.Quando;
import io.restassured.module.mockmvc.response.MockMvcResponse;
import org.springframework.beans.factory.annotation.Autowired;

/** Steps de verificações de segurança e acesso a endpoints protegidos. */
public class AuthSecuritySteps {

  @Autowired private ApiClient apiClient;
  @Autowired private ScenarioContext context;
  @Autowired private AuthStepsContext authContext;

  // =========================================================
  // AÇÕES — ENDPOINTS PROTEGIDOS
  // =========================================================

  @Quando("acesso a listagem de ativos sem autenticação")
  public void acessoAListagemDeAtivosSemAutenticacao() {
    MockMvcResponse response = apiClient.getSemToken("/assets");
    setLastResponse(response);
  }

  @Quando("acesso a listagem de ativos com token inválido {string}")
  public void acessoAListagemDeAtivosComTokenInvalido(String token) {
    setLastResponse(apiClient.listarAtivos(token));
  }

  @Quando("acesso a listagem de ativos com token sem prefixo Bearer {string}")
  public void acessoAListagemDeAtivosComTokenSemBearer(String token) {
    setLastResponse(apiClient.listarAtivosComHeaderAuthorizationBruto(token));
  }

  // =========================================================
  // VERIFICAÇÕES — CONTRATOS E HEADERS
  // =========================================================

  @E("a resposta de autenticação deve conter accessToken e refreshToken")
  public void aRespostaDeAutenticacaoDeveConterTokens() {
    MockMvcResponse response = context.getLastResponse();

    assertThat((String) response.path("accessToken"))
        .as("A resposta nao contem accessToken. Body: %s", response.getBody().asString())
        .isNotBlank();

    assertThat((String) response.path("refreshToken"))
        .as("A resposta nao contem refreshToken. Body: %s", response.getBody().asString())
        .isNotBlank();
  }

  @E("a resposta deve conter o header {string} com valor {string}")
  public void aRespostaDeveConterHeaderComValor(String header, String value) {
    assertThat(context.getLastResponse().getHeader(header)).isEqualTo(value);
  }

  // =========================================================
  // HELPERS INTERNOS
  // =========================================================

  private void setLastResponse(MockMvcResponse response) {
    context.setLastResponse(response);
  }
}
