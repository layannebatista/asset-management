package com.portfolio.assetmanagement.service.auth;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.portfolio.assetmanagement.domain.user.entity.User;
import com.portfolio.assetmanagement.domain.user.enums.UserStatus;
import com.portfolio.assetmanagement.infrastructure.persistence.user.repository.UserRepository;
import com.portfolio.assetmanagement.security.service.UserDetailsServiceImpl;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import io.qameta.allure.Story;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@Epic("Backend")
@Feature("Serviços — Auth")
@Story("Carregamento de usuário")
@DisplayName("UserDetailsServiceImpl")
class UserDetailsServiceImplTest {

  @Mock private UserRepository userRepository;

  @Test
  @Severity(SeverityLevel.BLOCKER)
  @DisplayName("AU14 - Bloqueia autenticação de usuário não ACTIVE")
  void au14BloqueiaAutenticacaoDeUsuarioNaoActive() {
    UserDetailsServiceImpl service = new UserDetailsServiceImpl(userRepository);
    User blockedUser = buildUser(UserStatus.BLOCKED, "hash-ok");

    when(userRepository.findByEmail("blocked@secure.com")).thenReturn(Optional.of(blockedUser));

    assertThatThrownBy(() -> service.loadUserByUsername("blocked@secure.com"))
        .isInstanceOf(DisabledException.class)
        .hasMessageContaining("Usuário não está ativo");
  }

  @Test
  @Severity(SeverityLevel.BLOCKER)
  @DisplayName("AU15 - Bloqueia autenticação quando usuário não definiu senha")
  void au15BloqueiaAutenticacaoQuandoUsuarioNaoDefiniuSenha() {
    UserDetailsServiceImpl service = new UserDetailsServiceImpl(userRepository);
    User activeWithoutPassword = buildUser(UserStatus.ACTIVE, null);

    when(userRepository.findByEmail("nopassword@secure.com"))
        .thenReturn(Optional.of(activeWithoutPassword));

    assertThatThrownBy(() -> service.loadUserByUsername("nopassword@secure.com"))
        .isInstanceOf(DisabledException.class)
        .hasMessageContaining("ainda não definiu sua senha");
  }

  @Test
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("AU16 - Lança UsernameNotFoundException para email inexistente")
  void au16LancaUsernameNotFoundParaEmailInexistente() {
    UserDetailsServiceImpl service = new UserDetailsServiceImpl(userRepository);
    when(userRepository.findByEmail("missing@secure.com")).thenReturn(Optional.empty());

    assertThatThrownBy(() -> service.loadUserByUsername("missing@secure.com"))
        .isInstanceOf(UsernameNotFoundException.class)
        .hasMessageContaining("Usuário não encontrado");
  }

  private User buildUser(UserStatus status, String passwordHash) {
    User user = mock(User.class);
    when(user.getStatus()).thenReturn(status);
    when(user.getPasswordHash()).thenReturn(passwordHash);
    return user;
  }
}
