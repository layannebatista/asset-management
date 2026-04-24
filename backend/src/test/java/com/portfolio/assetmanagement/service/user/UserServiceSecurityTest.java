package com.portfolio.assetmanagement.service.user;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.portfolio.assetmanagement.application.audit.service.AuditService;
import com.portfolio.assetmanagement.application.user.service.UserActivationService;
import com.portfolio.assetmanagement.application.user.service.UserService;
import com.portfolio.assetmanagement.application.user.service.UserValidationService;
import com.portfolio.assetmanagement.application.whatsapp.service.WhatsAppService;
import com.portfolio.assetmanagement.domain.organization.entity.Organization;
import com.portfolio.assetmanagement.domain.unit.entity.Unit;
import com.portfolio.assetmanagement.infrastructure.persistence.user.repository.UserRepository;
import com.portfolio.assetmanagement.security.context.LoggedUserContext;
import com.portfolio.assetmanagement.security.enums.UserRole;
import com.portfolio.assetmanagement.shared.exception.BusinessException;
import java.lang.reflect.Field;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.Tag;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserService — segurança de criação")
@Tag("testType=Integration")
@Tag("module=User")
class UserServiceSecurityTest {

  @Mock private UserRepository userRepository;
  @Mock private AuditService auditService;
  @Mock private UserValidationService userValidationService;
  @Mock private WhatsAppService whatsAppService;
  @Mock private LoggedUserContext loggedUser;
  @Mock private UserActivationService userActivationService;

  @InjectMocks private UserService service;

  @Test
  @DisplayName("USER-S01 - operador não pode criar usuário")
  void operadorNaoPodeCriarUsuario() {
    Organization org = organizationWithId(1L);
    Unit unit = new Unit("Sede", org, false);

    when(loggedUser.isOperator()).thenReturn(true);

    assertThatThrownBy(
            () ->
                service.createUser(
                    "Novo",
                    "novo@acme.com",
                    null,
                    UserRole.OPERADOR,
                    org,
                    unit,
                    "12345678901",
                    null))
        .isInstanceOf(BusinessException.class)
        .hasMessageContaining("Operador não pode criar usuários");

    verify(userRepository, never()).save(any());
  }

  @Test
  @DisplayName("USER-S02 - gestor só cria usuário na própria unidade")
  void gestorForaDaUnidadeLancaBusinessException() {
    Organization org = organizationWithId(1L);
    Unit unit = new Unit("Filial", org, false);

    when(loggedUser.isOperator()).thenReturn(false);
    when(loggedUser.isManager()).thenReturn(true);
    when(loggedUser.getUnitId()).thenReturn(999L);

    assertThatThrownBy(
            () ->
                service.createUser(
                    "Novo",
                    "novo@acme.com",
                    null,
                    UserRole.OPERADOR,
                    org,
                    unit,
                    "12345678901",
                    null))
        .isInstanceOf(BusinessException.class)
        .hasMessageContaining("própria unidade");
  }

  @Test
  @DisplayName("USER-S03 - bloqueia criação em organização diferente da sessão")
  void organizacaoDiferenteDaSessao() {
    Organization org = organizationWithId(1L);
    Unit unit = new Unit("Sede", org, false);

    when(loggedUser.isOperator()).thenReturn(false);
    when(loggedUser.isManager()).thenReturn(false);
    when(loggedUser.getOrganizationId()).thenReturn(999L);

    assertThatThrownBy(
            () ->
                service.createUser(
                    "Novo",
                    "novo@acme.com",
                    null,
                    UserRole.OPERADOR,
                    org,
                    unit,
                    "12345678901",
                    null))
        .isInstanceOf(BusinessException.class)
        .hasMessageContaining("não pertence a esta organização");
  }

  private Organization organizationWithId(Long id) {
    Organization organization = new Organization("Org " + id);
    try {
      Field field = Organization.class.getDeclaredField("id");
      field.setAccessible(true);
      field.set(organization, id);
      return organization;
    } catch (ReflectiveOperationException e) {
      throw new IllegalStateException("Falha ao preparar Organization de teste", e);
    }
  }
}
