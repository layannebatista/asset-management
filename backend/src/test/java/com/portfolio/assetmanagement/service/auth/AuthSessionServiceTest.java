package com.portfolio.assetmanagement.service.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.portfolio.assetmanagement.application.mfa.service.MfaService;
import com.portfolio.assetmanagement.domain.auth.entity.RefreshToken;
import com.portfolio.assetmanagement.domain.organization.entity.Organization;
import com.portfolio.assetmanagement.domain.unit.entity.Unit;
import com.portfolio.assetmanagement.domain.user.entity.User;
import com.portfolio.assetmanagement.domain.user.enums.UserStatus;
import com.portfolio.assetmanagement.infrastructure.persistence.user.repository.UserRepository;
import com.portfolio.assetmanagement.security.dto.LoginResponseDTO;
import com.portfolio.assetmanagement.security.dto.MfaVerifyRequestDTO;
import com.portfolio.assetmanagement.security.dto.RefreshRequestDTO;
import com.portfolio.assetmanagement.security.enums.UserRole;
import com.portfolio.assetmanagement.security.service.AuthService;
import com.portfolio.assetmanagement.security.service.RefreshTokenService;
import com.portfolio.assetmanagement.shared.exception.NotFoundException;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import io.qameta.allure.Story;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.authentication.AuthenticationManager;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@Epic("Backend")
@Feature("Serviços — Auth")
@Story("Sessão")
@DisplayName("AuthService — Sessão")
@Tag("testType=Integration")
@Tag("module=Auth")
class AuthSessionServiceTest {

  @Mock private AuthenticationManager authenticationManager;
  @Mock private com.portfolio.assetmanagement.security.service.TokenService tokenService;
  @Mock private UserRepository userRepository;
  @Mock private MfaService mfaService;
  @Mock private RefreshTokenService refreshTokenService;

  private AuthService authService;

  @BeforeEach
  void setup() {
    authService =
        new AuthService(
            authenticationManager, tokenService, userRepository, mfaService, refreshTokenService);
  }

  @Test
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("[INTEGRACAO][ASSET] AU05 - verifyMfa valida código e retorna tokens")
  void au05VerifyMfaValidaCodigoERetornaTokens() {
    MfaVerifyRequestDTO request = new MfaVerifyRequestDTO();
    request.setUserId(1L);
    request.setCode("123456");

    User user = buildUser("admin@secure.com", "hash-ok");
    RefreshToken refreshToken = new RefreshToken(1L, 3600);

    when(userRepository.findById(1L)).thenReturn(Optional.of(user));
    when(tokenService.generateToken(any())).thenReturn("access-token-ok");
    when(refreshTokenService.generate(1L)).thenReturn(refreshToken);

    LoginResponseDTO response = authService.verifyMfa(request);

    verify(mfaService).validate(1L, "123456");
    assertThat(response.getAccessToken()).isEqualTo("access-token-ok");
    assertThat(response.getRefreshToken()).isEqualTo(refreshToken.getToken());
    assertThat(response.getEmail()).isEqualTo("admin@secure.com");
  }

  @Test
  @Severity(SeverityLevel.NORMAL)
  @DisplayName(
      "[INTEGRACAO][ASSET] AU06 - verifyMfa lança NotFoundException para usuário inexistente")
  void au06VerifyMfaLancaNotFoundParaUsuarioInexistente() {
    MfaVerifyRequestDTO request = new MfaVerifyRequestDTO();
    request.setUserId(999L);
    request.setCode("123456");

    when(userRepository.findById(999L)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> authService.verifyMfa(request))
        .isInstanceOf(NotFoundException.class)
        .hasMessageContaining("Usuário não encontrado");
  }

  @Test
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("[INTEGRACAO][ASSET] AU07 - refresh rotaciona token e emite nova sessão")
  void au07RefreshRotacionaTokenEEmiteNovaSessao() {
    RefreshRequestDTO request = new RefreshRequestDTO();
    request.setRefreshToken("refresh-antigo");

    RefreshToken rotated = new RefreshToken(1L, 3600);
    User user = buildUser("admin@secure.com", "hash-ok");
    RefreshToken newRefresh = new RefreshToken(1L, 3600);

    when(refreshTokenService.validateAndRotate("refresh-antigo")).thenReturn(rotated);
    when(userRepository.findById(rotated.getUserId())).thenReturn(Optional.of(user));
    when(tokenService.generateToken(any())).thenReturn("novo-access-token");
    when(refreshTokenService.generate(1L)).thenReturn(newRefresh);

    LoginResponseDTO response = authService.refresh(request);

    assertThat(response.getAccessToken()).isEqualTo("novo-access-token");
    assertThat(response.getRefreshToken()).isEqualTo(newRefresh.getToken());
    assertThat(response.getEmail()).isEqualTo("admin@secure.com");
  }

  @Test
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("[INTEGRACAO][ASSET] AU08 - logout revoga todos os refresh tokens do usuário")
  void au08LogoutRevogaTodosOsRefreshTokensDoUsuario() {
    authService.logout(99L);

    verify(refreshTokenService).revokeAll(99L);
  }

  private User buildUser(String email, String passwordHash) {
    Organization organization = org.mockito.Mockito.mock(Organization.class);
    when(organization.getId()).thenReturn(1L);

    Unit unit = org.mockito.Mockito.mock(Unit.class);
    when(unit.getId()).thenReturn(10L);

    User user = org.mockito.Mockito.mock(User.class);
    when(user.getId()).thenReturn(1L);
    when(user.getEmail()).thenReturn(email);
    when(user.getRole()).thenReturn(UserRole.ADMIN);
    when(user.getOrganization()).thenReturn(organization);
    when(user.getUnit()).thenReturn(unit);
    when(user.getStatus()).thenReturn(UserStatus.ACTIVE);
    when(user.getPasswordHash()).thenReturn(passwordHash);
    return user;
  }
}
