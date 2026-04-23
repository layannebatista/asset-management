package com.portfolio.assetmanagement.service.inventory;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.portfolio.assetmanagement.application.inventory.service.InventoryLockService;
import com.portfolio.assetmanagement.application.inventory.service.InventoryService;
import com.portfolio.assetmanagement.application.inventory.service.InventoryValidationService;
import com.portfolio.assetmanagement.application.unit.service.UnitService;
import com.portfolio.assetmanagement.domain.organization.entity.Organization;
import com.portfolio.assetmanagement.domain.unit.entity.Unit;
import com.portfolio.assetmanagement.infrastructure.persistence.inventory.repository.InventorySessionRepository;
import com.portfolio.assetmanagement.security.context.LoggedUserContext;
import com.portfolio.assetmanagement.shared.exception.ForbiddenException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("InventoryService — controle de acesso")
class InventoryServiceAccessTest {

  @Mock private InventorySessionRepository repository;
  @Mock private UnitService unitService;
  @Mock private LoggedUserContext loggedUser;
  @Mock private InventoryValidationService validationService;
  @Mock private InventoryLockService lockService;

  @InjectMocks private InventoryService service;

  @Test
  @DisplayName("INV-S01 - operador não pode criar inventário")
  void operadorNaoPodeCriarInventario() {
    Organization org = mock(Organization.class);
    when(org.getId()).thenReturn(1L);
    Unit unit = new Unit("Sede", org, false);

    when(unitService.findById(1L)).thenReturn(unit);
    when(loggedUser.getOrganizationId()).thenReturn(1L);
    when(loggedUser.isManager()).thenReturn(false);
    when(loggedUser.isOperator()).thenReturn(true);

    assertThatThrownBy(() -> service.create(1L))
        .isInstanceOf(ForbiddenException.class)
        .hasMessageContaining("Operador não pode criar inventário");
  }
}
