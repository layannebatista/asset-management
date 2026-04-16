package com.portfolio.assetmanagement.bdd.steps;

import static org.assertj.core.api.Assertions.assertThat;

import com.portfolio.assetmanagement.bdd.client.ApiClient;
import com.portfolio.assetmanagement.bdd.context.ScenarioContext;
import io.cucumber.java.pt.Dado;
import io.cucumber.java.pt.E;
import io.cucumber.java.pt.Então;
import io.cucumber.java.pt.Quando;
import io.restassured.module.mockmvc.response.MockMvcResponse;
import org.springframework.beans.factory.annotation.Autowired;

/**
 * CAMADA 3 - Step Definitions para a feature de Autenticacao.
 *
 * <p>Segue o mesmo padrao das demais automacoes BDD: os steps usam o ApiClient para interagir com
 * os endpoints reais e o ScenarioContext para compartilhar respostas e token de acesso ao longo do
 * cenario.
 */
public class AuthSteps {

  @Autowired private ApiClient apiClient;
  @Autowired private ScenarioContext context;

  private String refreshToken;
  private String previousRefreshToken;

  @Dado("que realizei login com email {string} e senha {string}")
  @Quando("realizo login com email {string} e senha {string}")
  public void realizoLoginComEmailESenha(String email, String senha) {
    MockMvcResponse response = apiClient.login(email, senha);
    context.setLastResponse(response);

    if (response.statusCode() == 200) {
      String accessToken = response.path("accessToken");
      if (accessToken != null && !accessToken.isBlank()) {
        context.setToken(accessToken);
      }
    }
  }

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

  @E("salvo o refresh token retornado")
  public void salvoORefreshTokenRetornado() {
    refreshToken = context.getLastResponse().path("refreshToken");
    previousRefreshToken = refreshToken;

    assertThat(refreshToken)
        .as("Refresh token nao encontrado para uso nos proximos steps")
        .isNotBlank();
  }

  @Quando("renovo a sessão com o refresh token salvo")
  public void renovoASessaoComORefreshTokenSalvo() {
    MockMvcResponse response = apiClient.refresh(refreshToken);
    context.setLastResponse(response);

    if (response.statusCode() == 200) {
      refreshToken = response.path("refreshToken");
    }
  }

  @Quando("faço logout com o token de acesso salvo")
  public void facoLogoutComOTokenDeAcessoSalvo() {
    MockMvcResponse response = apiClient.logout(context.getToken());
    context.setLastResponse(response);
  }

  @Quando("acesso a listagem de ativos sem autenticação")
  public void acessoAListagemDeAtivosSemAutenticacao() {
    MockMvcResponse response = apiClient.getSemToken("/assets");
    context.setLastResponse(response);
  }

  @Quando("renovo a sessão com token inválido {string}")
  public void renovoASessaoComTokenInvalido(String tokenInvalido) {
    MockMvcResponse response = apiClient.refresh(tokenInvalido);
    context.setLastResponse(response);
  }

  @Quando("renovo a sessão sem enviar token")
  public void renovoASessaoSemEnviarToken() {
    MockMvcResponse response = apiClient.refreshSemCorpo();
    context.setLastResponse(response);
  }

  @Quando("faço logout sem autenticação")
  public void facoLogoutSemAutenticacao() {
    MockMvcResponse response = apiClient.logoutSemToken();
    context.setLastResponse(response);
  }

  @Então("o novo refresh token deve ser diferente do anterior")
  public void oNovoRefreshTokenDeveSerDiferenteDoAnterior() {
    assertThat(refreshToken)
        .as("O refresh token novo nao foi capturado apos o refresh")
        .isNotBlank()
        .isNotEqualTo(previousRefreshToken);
  }
}
