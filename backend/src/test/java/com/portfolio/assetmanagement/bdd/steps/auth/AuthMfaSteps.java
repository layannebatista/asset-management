package com.portfolio.assetmanagement.bdd.steps.auth;

import static org.assertj.core.api.Assertions.assertThat;

import com.portfolio.assetmanagement.bdd.client.ApiClient;
import com.portfolio.assetmanagement.bdd.context.ScenarioContext;
import com.portfolio.assetmanagement.bdd.support.TestDataHelper;
import io.cucumber.java.pt.E;
import io.cucumber.java.pt.Quando;
import io.restassured.module.mockmvc.response.MockMvcResponse;
import org.springframework.beans.factory.annotation.Autowired;

/** Steps de ações relacionadas a MFA (autenticação multifator). */
public class AuthMfaSteps {

  @Autowired private ApiClient apiClient;
  @Autowired private ScenarioContext context;
  @Autowired private TestDataHelper testDataHelper;
  @Autowired private AuthStepsContext authContext;

  private String mfaCode;

  // =========================================================
  // AÇÕES — MFA
  // =========================================================

  @Quando("verifico o MFA com o código gerado para o usuário salvo")
  public void verificoMfaComCodigoGeradoParaUsuarioSalvo() {
    mfaCode = testDataHelper.obterCodigoMfaValido(authContext.getMfaUserId());
    MockMvcResponse response = apiClient.verifyMfa(authContext.getMfaUserId(), mfaCode);
    setLastResponse(response);
    if (response.statusCode() == 200) {
      context.setToken(response.path("accessToken"));
    }
  }

  @Quando("verifico o MFA com código inválido {string} para o usuário salvo")
  public void verificoMfaComCodigoInvalidoParaUsuarioSalvo(String code) {
    setLastResponse(apiClient.verifyMfa(authContext.getMfaUserId(), code));
  }

  @Quando("verifico novamente o mesmo código MFA do usuário salvo")
  public void verificoNovamenteOMesmoCodigoMfaDoUsuarioSalvo() {
    setLastResponse(apiClient.verifyMfa(authContext.getMfaUserId(), mfaCode));
  }

  @Quando("verifico o MFA sem enviar o campo code para o usuário salvo")
  public void verificoMfaSemCampoCodeParaUsuarioSalvo() {
    setLastResponse(apiClient.verifyMfaSemCode(authContext.getMfaUserId()));
  }

  @Quando("verifico o MFA sem enviar o campo userId com o código {string}")
  public void verificoMfaSemCampoUserIdComCodigo(String code) {
    setLastResponse(apiClient.verifyMfaSemUserId(code));
  }

  // =========================================================
  // AÇÕES — RATE LIMIT DE MFA
  // =========================================================

  @Quando("verifico MFA com código {string} para o userId {long} a partir do IP {string} por {int} tentativas")
  public void verificoMfaComMesmoIpPorTentativas(
      String code, Long userId, String ip, int tentativas) {
    setLastResponse(executarTentativasMfa(code, userId, ip, tentativas));
  }

  @Quando("verifico MFA com código inválido {string} para o usuário salvo a partir do IP {string} por {int} tentativas")
  public void verificoMfaComMesmoIpPorTentativasUsandoUsuarioSalvo(
      String code, String ip, int tentativas) {
    setLastResponse(executarTentativasMfa(code, authContext.getMfaUserId(), ip, tentativas));
  }

  // =========================================================
  // VERIFICAÇÕES
  // =========================================================

  @E("a resposta deve indicar MFA obrigatório")
  public void aRespostaDeveIndicarMfaObrigatorio() {
    MockMvcResponse response = context.getLastResponse();

    assertThat((Boolean) response.path("mfaRequired")).isTrue();
    assertThat((String) response.path("accessToken")).isNull();
    assertThat((String) response.path("refreshToken")).isNull();
    Number rawUserId = response.path("userId");
    assertThat(rawUserId).isNotNull();
    authContext.setMfaUserId(rawUserId.longValue());
  }

  // =========================================================
  // HELPERS INTERNOS
  // =========================================================

  private void setLastResponse(MockMvcResponse response) {
    context.setLastResponse(response);
  }

  private MockMvcResponse executarTentativasMfa(
      String code, Long userId, String ip, int tentativas) {
    MockMvcResponse response = null;
    for (int attempt = 0; attempt < tentativas; attempt++) {
      response = apiClient.verifyMfaComIp(userId, code, ip);
    }
    return response;
  }
}
