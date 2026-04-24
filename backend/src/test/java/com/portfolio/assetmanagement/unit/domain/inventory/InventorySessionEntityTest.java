package com.portfolio.assetmanagement.unit.domain.inventory;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.portfolio.assetmanagement.domain.inventory.entity.InventorySession;
import com.portfolio.assetmanagement.domain.inventory.enums.InventoryStatus;
import com.portfolio.assetmanagement.domain.organization.entity.Organization;
import com.portfolio.assetmanagement.domain.unit.entity.Unit;
import com.portfolio.assetmanagement.domain.user.entity.User;
import com.portfolio.assetmanagement.shared.exception.BusinessException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("InventorySession — domínio")
@Tag("testType=Unit")
@Tag("module=Domain")
class InventorySessionEntityTest {

  @Test
  @DisplayName("INV-U01 - sessão inicia em OPEN")
  void sessaoIniciaOpen() {
    Organization org = mock(Organization.class);
    Unit unit = mock(Unit.class);
    User user = mock(User.class);
    when(org.getId()).thenReturn(1L);
    when(unit.getOrganization()).thenReturn(org);
    when(user.getOrganization()).thenReturn(org);

    InventorySession session = new InventorySession(org, unit, user);

    assertThat(session.getStatus()).isEqualTo(InventoryStatus.OPEN);
  }

  @Test
  @DisplayName("INV-U02 - não fecha sessão sem estar IN_PROGRESS")
  void naoFechaSemInProgress() {
    Organization org = mock(Organization.class);
    Unit unit = mock(Unit.class);
    User user = mock(User.class);
    when(org.getId()).thenReturn(1L);
    when(unit.getOrganization()).thenReturn(org);
    when(user.getOrganization()).thenReturn(org);

    InventorySession session = new InventorySession(org, unit, user);

    assertThatThrownBy(session::close)
        .isInstanceOf(BusinessException.class)
        .hasMessageContaining("IN_PROGRESS");
  }
}
