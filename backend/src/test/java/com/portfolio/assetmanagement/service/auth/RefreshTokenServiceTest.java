package com.portfolio.assetmanagement.service.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.portfolio.assetmanagement.domain.auth.entity.RefreshToken;
import com.portfolio.assetmanagement.infrastructure.persistence.auth.repository.RefreshTokenRepository;
import com.portfolio.assetmanagement.security.service.RefreshTokenService;
import com.portfolio.assetmanagement.shared.exception.BusinessException;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import io.qameta.allure.Story;
import java.lang.reflect.Field;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.Tag;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@Epic("Backend")
@Feature("Serviços — Auth")
@Story("Refresh token")
@DisplayName("RefreshTokenService")
@Tag("testType=Integration")
@Tag("module=Auth")
class RefreshTokenServiceTest {

  @Mock private RefreshTokenRepository repository;

  private RefreshTokenService service;

  @BeforeEach
  void setup() {
    service = new RefreshTokenService(repository);
    setRefreshExpirationSeconds(3600L);
  }

  @Test
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("AU09 - generate cria e persiste refresh token")
  void au09GenerateCriaEPersisteRefreshToken() {
    when(repository.save(anyToken())).thenAnswer(invocation -> invocation.getArgument(0));

    RefreshToken token = service.generate(10L);

    assertThat(token.getUserId()).isEqualTo(10L);
    assertThat(token.getToken()).isNotBlank();
    assertThat(token.isRevoked()).isFalse();
    verify(repository).save(anyToken());
  }

  @Test
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("AU10 - validateAndRotate revoga token válido")
  void au10ValidateAndRotateRevogaTokenValido() {
    RefreshToken token = new RefreshToken(10L, 3600);
    when(repository.findByToken(token.getToken())).thenReturn(Optional.of(token));

    RefreshToken validated = service.validateAndRotate(token.getToken());

    assertThat(validated).isSameAs(token);
    assertThat(token.isRevoked()).isTrue();
  }

  @Test
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("AU11 - validateAndRotate falha para token inexistente")
  void au11ValidateAndRotateFalhaParaTokenInexistente() {
    when(repository.findByToken("nao-existe")).thenReturn(Optional.empty());

    assertThatThrownBy(() -> service.validateAndRotate("nao-existe"))
        .isInstanceOf(BusinessException.class)
        .hasMessageContaining("Refresh token inválido");
  }

  @Test
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("AU12 - revokeAll delega revogação para o repositório")
  void au12RevokeAllDelegaRevogacaoParaORepositorio() {
    service.revokeAll(99L);

    verify(repository).revokeAllByUserId(99L);
  }

  @Test
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("AU13 - purgeExpired remove tokens expirados com Instant.now")
  void au13PurgeExpiredRemoveTokensExpirados() {
    service.purgeExpired();

    verify(repository).deleteExpired(anyInstant());
  }

  private RefreshToken anyToken() {
    return org.mockito.ArgumentMatchers.any(RefreshToken.class);
  }

  private Instant anyInstant() {
    return org.mockito.ArgumentMatchers.any(Instant.class);
  }

  private void setRefreshExpirationSeconds(long seconds) {
    try {
      Field field = RefreshTokenService.class.getDeclaredField("refreshExpirationSeconds");
      field.setAccessible(true);
      field.setLong(service, seconds);
    } catch (ReflectiveOperationException ex) {
      throw new IllegalStateException("Falha ao configurar refreshExpirationSeconds", ex);
    }
  }
}
