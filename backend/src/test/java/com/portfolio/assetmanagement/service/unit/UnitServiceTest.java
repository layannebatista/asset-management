package com.portfolio.assetmanagement.service.unit;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.portfolio.assetmanagement.application.audit.service.AuditService;
import com.portfolio.assetmanagement.application.unit.service.UnitService;
import com.portfolio.assetmanagement.domain.organization.entity.Organization;
import com.portfolio.assetmanagement.domain.unit.entity.Unit;
import com.portfolio.assetmanagement.domain.unit.enums.UnitStatus;
import com.portfolio.assetmanagement.infrastructure.persistence.unit.repository.UnitRepository;
import com.portfolio.assetmanagement.shared.exception.BusinessException;
import com.portfolio.assetmanagement.shared.exception.NotFoundException;
import java.lang.reflect.Field;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("UnitService — regras críticas")
class UnitServiceTest {

  @Mock private UnitRepository unitRepository;
  @Mock private AuditService auditService;

  @InjectMocks private UnitService service;

  @Test
  @DisplayName("UNIT-S01 - createUnit com nome em branco lança BusinessException")
  void createUnitNomeInvalido() {
    Organization org = organizationWithId(1L);

    assertThatThrownBy(() -> service.createUnit("   ", org))
        .isInstanceOf(BusinessException.class)
        .hasMessageContaining("Nome da unidade é obrigatório");

    verify(unitRepository, never()).save(any(Unit.class));
  }

  @Test
  @DisplayName("UNIT-S02 - findById inexistente lança NotFoundException")
  void findByIdInexistente() {
    when(unitRepository.findById(55L)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> service.findById(55L))
        .isInstanceOf(NotFoundException.class)
        .hasMessageContaining("Unidade não encontrada");
  }

  @Test
  @DisplayName("UNIT-S03 - não permite inativar unidade principal")
  void naoPermiteInativarUnidadePrincipal() {
    Organization org = organizationWithId(1L);
    Unit main = new Unit("Unidade Principal", org, true);
    when(unitRepository.findById(1L)).thenReturn(Optional.of(main));

    assertThatThrownBy(() -> service.inactivateUnit(1L))
        .isInstanceOf(BusinessException.class)
        .hasMessageContaining("unidade principal");
  }

  @Test
  @DisplayName("UNIT-S04 - activate em unidade inativa persiste alteração")
  void activatePersisteAlteracao() {
    Organization org = organizationWithId(1L);
    Unit unit = new Unit("Filial", org, false);
    unit.setStatus(UnitStatus.INACTIVE);
    when(unitRepository.findById(2L)).thenReturn(Optional.of(unit));

    service.activateUnit(2L);

    verify(unitRepository).save(any(Unit.class));
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
