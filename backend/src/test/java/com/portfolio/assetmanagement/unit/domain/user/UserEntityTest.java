package com.portfolio.assetmanagement.unit.domain.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.portfolio.assetmanagement.domain.organization.entity.Organization;
import com.portfolio.assetmanagement.domain.unit.entity.Unit;
import com.portfolio.assetmanagement.domain.user.entity.User;
import com.portfolio.assetmanagement.domain.user.enums.UserStatus;
import com.portfolio.assetmanagement.security.enums.UserRole;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

@DisplayName("User — domínio")
@Tag("testType=Unit")
@Tag("module=Domain")
class UserEntityTest {

  @Test
  @DisplayName("USER-U01 - construtor inicia em PENDING_ACTIVATION")
  void construtorIniciaPendenteAtivacao() {
    Organization org = mock(Organization.class);
    Unit unit = mock(Unit.class);
    when(org.getId()).thenReturn(1L);
    when(unit.getOrganization()).thenReturn(org);

    User user = new User("Nome", "n@a.com", null, UserRole.OPERADOR, org, unit, "123");

    assertThat(user.getStatus()).isEqualTo(UserStatus.PENDING_ACTIVATION);
  }

  @Test
  @DisplayName("USER-U02 - valida que unidade pertence à organização")
  void validaUnidadeDaOrganizacao() {
    Organization org1 = mock(Organization.class);
    Organization org2 = mock(Organization.class);
    Unit unit = mock(Unit.class);
    when(org1.getId()).thenReturn(1L);
    when(org2.getId()).thenReturn(2L);
    when(unit.getOrganization()).thenReturn(org2);

    assertThatThrownBy(
            () -> new User("Nome", "n@a.com", null, UserRole.OPERADOR, org1, unit, "123"))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("Unidade não pertence");
  }

  @Test
  @DisplayName("USER-U03 - block altera status para BLOCKED")
  void blockAlteraStatus() {
    Organization org = mock(Organization.class);
    Unit unit = mock(Unit.class);
    when(org.getId()).thenReturn(1L);
    when(unit.getOrganization()).thenReturn(org);

    User user = new User("Nome", "n@a.com", null, UserRole.OPERADOR, org, unit, "123");
    user.block();

    assertThat(user.getStatus()).isEqualTo(UserStatus.BLOCKED);
  }
}
