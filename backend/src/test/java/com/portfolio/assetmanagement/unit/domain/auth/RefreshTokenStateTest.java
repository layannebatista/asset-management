package com.portfolio.assetmanagement.unit.domain.auth;

import static org.assertj.core.api.Assertions.assertThat;

import com.portfolio.assetmanagement.domain.auth.entity.RefreshToken;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import io.qameta.allure.Story;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Tag;

@Epic("Backend")
@Feature("Domínio — Auth")
@Story("Refresh token")
@DisplayName("RefreshToken — Estado")
@Tag("testType=Unit")
@Tag("module=Domain")
class RefreshTokenStateTest {

  @Test
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("AT03 - isValid retorna true para token ativo e não expirado")
  void at03IsValidRetornaTrueParaTokenAtivoENaoExpirado() {
    RefreshToken token = new RefreshToken(10L, 3600);

    assertThat(token.isValid()).isTrue();
  }

  @Test
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("AT04 - revoke invalida o token")
  void at04RevokeInvalidaOToken() {
    RefreshToken token = new RefreshToken(10L, 3600);

    token.revoke();

    assertThat(token.isRevoked()).isTrue();
    assertThat(token.isValid()).isFalse();
  }

  @Test
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("AT05 - Token expirado é inválido")
  void at05TokenExpiradoEInvalido() {
    RefreshToken token = new RefreshToken(10L, -1);

    assertThat(token.isValid()).isFalse();
  }
}