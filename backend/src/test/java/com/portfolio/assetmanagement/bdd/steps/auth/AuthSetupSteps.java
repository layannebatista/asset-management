package com.portfolio.assetmanagement.bdd.steps.auth;

import static org.assertj.core.api.Assertions.assertThat;

import com.portfolio.assetmanagement.bdd.context.ScenarioContext;
import com.portfolio.assetmanagement.bdd.support.TestDataHelper;
import com.portfolio.assetmanagement.domain.organization.entity.Organization;
import com.portfolio.assetmanagement.domain.unit.entity.Unit;
import com.portfolio.assetmanagement.domain.user.entity.User;
import com.portfolio.assetmanagement.domain.user.enums.UserStatus;
import com.portfolio.assetmanagement.infrastructure.persistence.user.repository.UserRepository;
import com.portfolio.assetmanagement.security.enums.UserRole;
import io.cucumber.java.pt.E;
import org.springframework.beans.factory.annotation.Autowired;

/** Steps de preparação de dados (Dado/E) para cenários de autenticação. */
public class AuthSetupSteps {

  @Autowired private ScenarioContext context;
  @Autowired private TestDataHelper testDataHelper;
  @Autowired private AuthStepsContext authContext;
  @Autowired private UserRepository userRepository;

  // =========================================================
  // CONTEXTO / DADOS DE APOIO
  // =========================================================

  @E("que existe um usuário {string} com email {string} e senha {string} no status {string}")
  public void queExisteUsuarioComStatus(String role, String email, String senha, String status) {
    Organization org = testDataHelper.obterOrganizacao(context.getId("organizacaoId"));
    Unit unit = testDataHelper.obterUnidade(context.getId("unidadeId"));
    User user =
        testDataHelper.criarUsuarioComStatus(
            email, senha, UserRole.valueOf(role), org, unit, UserStatus.valueOf(status), null);
    context.setId("usuarioId_" + email, user.getId());
  }

  @E("que existe um usuário {string} com email {string} e senha {string} e telefone {string}")
  public void queExisteUsuarioComTelefone(String role, String email, String senha, String phone) {
    Organization org = testDataHelper.obterOrganizacao(context.getId("organizacaoId"));
    Unit unit = testDataHelper.obterUnidade(context.getId("unidadeId"));
    User user =
        testDataHelper.criarUsuarioComTelefone(
            email, senha, UserRole.valueOf(role), org, unit, phone);
    context.setId("usuarioId_" + email, user.getId());
  }

  // =========================================================
  // PREPARAÇÃO DE TOKENS / ESTADO DE SESSÃO
  // =========================================================

  @E("salvo o refresh token retornado")
  public void salvoORefreshTokenRetornado() {
    String token = context.getLastResponse().path("refreshToken");
    authContext.setRefreshToken(token);
    authContext.setPreviousRefreshToken(token);

    assertThat(token).as("Refresh token nao encontrado para uso nos proximos steps").isNotBlank();
  }

  @E("salvo o refresh token retornado como secundário")
  public void salvoORefreshTokenRetornadoComoSecundario() {
    String token = context.getLastResponse().path("refreshToken");
    authContext.setSecondaryRefreshToken(token);
    assertThat(token).isNotBlank();
  }

  @E("que o usuário com email {string} é desativado")
  public void queOUsuarioComEmailEDesativado(String email) {
    Long userId = context.getId("usuarioId_" + email);
    User user =
        userRepository
            .findById(userId)
            .orElseThrow(() -> new AssertionError("Usuário não encontrado: " + email));
    user.inactivate();
    userRepository.save(user);
  }
}
