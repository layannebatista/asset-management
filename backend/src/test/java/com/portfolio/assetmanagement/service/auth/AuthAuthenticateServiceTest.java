package com.portfolio.assetmanagement.service.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.portfolio.assetmanagement.application.mfa.service.MfaService;
import com.portfolio.assetmanagement.domain.auth.entity.RefreshToken;
import com.portfolio.assetmanagement.domain.organization.entity.Organization;
import com.portfolio.assetmanagement.domain.unit.entity.Unit;
import com.portfolio.assetmanagement.domain.user.entity.User;
import com.portfolio.assetmanagement.domain.user.enums.UserStatus;
import com.portfolio.assetmanagement.infrastructure.persistence.user.repository.UserRepository;
import com.portfolio.assetmanagement.security.dto.LoginRequestDTO;
import com.portfolio.assetmanagement.security.dto.LoginResponseDTO;
import com.portfolio.assetmanagement.security.enums.UserRole;
import com.portfolio.assetmanagement.security.service.AuthService;
import com.portfolio.assetmanagement.security.service.RefreshTokenService;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import io.qameta.allure.Story;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@Epic("Backend")
@Feature("Serviços — Auth")
@Story("Autenticação")
@DisplayName("AuthService — Authenticate")
class AuthAuthenticateServiceTest {

  @Mock private AuthenticationManager authenticationManager;
  @Mock private com.portfolio.assetmanagement.security.service.TokenService tokenService;
  @Mock private UserRepository userRepository;
  @Mock private MfaService mfaService;
  @Mock private RefreshTokenService refreshTokenService;
  @Mock private Authentication authentication;
  @Mock private UserDetails userDetails;

  private AuthService authService;

  @BeforeEach
  void setup() {
    authService =
        new AuthService(
            authenticationManager, tokenService, userRepository, mfaService, refreshTokenService);
  }

  @Test
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("AU01 - Autentica usuário sem telefone e retorna tokens")
  void au01AutenticaUsuarioSemTelefoneERetornaTokens() {
    LoginRequestDTO request = new LoginRequestDTO();
    request.setEmail("admin@secure.com");
    request.setPassword("Senha@123");

    User user = buildUser("admin@secure.com", "hash-ok", null, UserStatus.ACTIVE);
    RefreshToken refreshToken = new RefreshToken(1L, 3600);

    when(authenticationManager.authenticate(any())).thenReturn(authentication);
    when(authentication.getPrincipal()).thenReturn(userDetails);
    when(userRepository.findByEmail("admin@secure.com")).thenReturn(Optional.of(user));
    when(tokenService.generateToken(userDetails)).thenReturn("access-token-ok");
    when(refreshTokenService.generate(1L)).thenReturn(refreshToken);

    LoginResponseDTO response = authService.authenticate(request);

    assertThat(response.isMfaRequired()).isFalse();
    assertThat(response.getAccessToken()).isEqualTo("access-token-ok");
    assertThat(response.getRefreshToken()).isEqualTo(refreshToken.getToken());
    assertThat(response.getEmail()).isEqualTo("admin@secure.com");
    verify(mfaService, never()).generateAndSend(any(), any());
  }

  @Test
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("AU02 - Usuário com telefone recebe challenge MFA sem emitir tokens")
  void au02UsuarioComTelefoneRecebeChallengeMfa() {
    LoginRequestDTO request = new LoginRequestDTO();
    request.setEmail("admin-mfa@secure.com");
    request.setPassword("Senha@123");

    User user = buildUser("admin-mfa@secure.com", "hash-ok", "5511999999999", UserStatus.ACTIVE);

    when(authenticationManager.authenticate(any())).thenReturn(authentication);
    when(authentication.getPrincipal()).thenReturn(userDetails);
    when(userRepository.findByEmail("admin-mfa@secure.com")).thenReturn(Optional.of(user));

    LoginResponseDTO response = authService.authenticate(request);

    assertThat(response.isMfaRequired()).isTrue();
    assertThat(response.getUserId()).isEqualTo(1L);
    assertThat(response.getAccessToken()).isNull();
    assertThat(response.getRefreshToken()).isNull();
    verify(mfaService).generateAndSend(1L, "5511999999999");
    verify(tokenService, never()).generateToken(any());
    verify(refreshTokenService, never()).generate(any());
  }

  @Test
  @Severity(SeverityLevel.BLOCKER)
  @DisplayName("AU03 - DisabledException é normalizada para credenciais inválidas")
  void au03DisabledExceptionENormalizadaParaCredenciaisInvalidas() {
    LoginRequestDTO request = new LoginRequestDTO();
    request.setEmail("blocked@secure.com");
    request.setPassword("Senha@123");

    when(authenticationManager.authenticate(any()))
        .thenThrow(new DisabledException("Usuário desabilitado"));

    assertThatThrownBy(() -> authService.authenticate(request))
        .isInstanceOf(BadCredentialsException.class)
        .hasMessageContaining("Email ou senha inválidos");
  }

  @Test
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("AU04 - Falha quando usuário não é encontrado após autenticação")
  void au04FalhaQuandoUsuarioNaoEncontradoAposAutenticacao() {
    LoginRequestDTO request = new LoginRequestDTO();
    request.setEmail("missing@secure.com");
    request.setPassword("Senha@123");

    when(authenticationManager.authenticate(any())).thenReturn(authentication);
    when(authentication.getPrincipal()).thenReturn(userDetails);
    when(userRepository.findByEmail("missing@secure.com")).thenReturn(Optional.empty());

    assertThatThrownBy(() -> authService.authenticate(request))
        .isInstanceOf(BadCredentialsException.class)
        .hasMessageContaining("Email ou senha inválidos");
  }

  private User buildUser(String email, String passwordHash, String phoneNumber, UserStatus status) {
    Organization organization = org.mockito.Mockito.mock(Organization.class);
    when(organization.getId()).thenReturn(1L);

    Unit unit = org.mockito.Mockito.mock(Unit.class);
    when(unit.getId()).thenReturn(10L);

    User user = org.mockito.Mockito.mock(User.class);
    when(user.getId()).thenReturn(1L);
    when(user.getEmail()).thenReturn(email);
    when(user.getRole()).thenReturn(UserRole.ADMIN);
    when(user.getPhoneNumber()).thenReturn(phoneNumber);
    when(user.getOrganization()).thenReturn(organization);
    when(user.getUnit()).thenReturn(unit);
    when(user.getStatus()).thenReturn(status);
    when(user.getPasswordHash()).thenReturn(passwordHash);
    when(user.isLgpdAccepted()).thenReturn(true);
    return user;
  }
}
