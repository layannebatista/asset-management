package com.portfolio.assetmanagement.unit.domain.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.portfolio.assetmanagement.domain.auth.entity.RefreshToken;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import io.qameta.allure.Story;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@Epic("Backend")
@Feature("Domínio — Auth")
@Story("Refresh token")
@DisplayName("RefreshToken — Construtor")
@Tag("testType=Unit")
@Tag("module=Domain")
class RefreshTokenConstructorTest {

  @Test
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("AT01 - Construtor gera token com dados obrigatórios")
  void at01ConstrutorGeraTokenComDadosObrigatorios() {
    RefreshToken token = new RefreshToken(10L, 3600);

    assertThat(token.getUserId()).isEqualTo(10L);
    assertThat(token.getToken()).isNotBlank();
    assertThat(token.getCreatedAt()).isNotNull();
    assertThat(token.getExpiresAt()).isAfter(token.getCreatedAt());
    assertThat(token.isRevoked()).isFalse();
  }

  @Test
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("AT02 - Construtor falha quando userId é nulo")
  void at02ConstrutorFalhaQuandoUserIdENulo() {
    assertThatThrownBy(() -> new RefreshToken(null, 3600))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("userId é obrigatório");
  }
}