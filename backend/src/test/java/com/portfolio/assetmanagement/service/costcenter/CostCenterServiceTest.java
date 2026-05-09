package com.portfolio.assetmanagement.service.costcenter;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.portfolio.assetmanagement.application.costcenter.service.CostCenterService;
import com.portfolio.assetmanagement.domain.costcenter.entity.CostCenter;
import com.portfolio.assetmanagement.infrastructure.persistence.costcenter.repository.CostCenterRepository;
import com.portfolio.assetmanagement.shared.exception.BusinessException;
import com.portfolio.assetmanagement.shared.exception.NotFoundException;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("CostCenterService — regras críticas")
@Tag("testType=Integration")
@Tag("module=Costcenter")
class CostCenterServiceTest {

  @Mock private CostCenterRepository repository;
  @InjectMocks private CostCenterService service;

  @Test
  @DisplayName("[INTEGRACAO][ASSET] CC-S01 - criação duplicada por código lança BusinessException")
  void criacaoDuplicadaLancaBusinessException() {
    when(repository.existsByOrganizationIdAndCode(1L, "FIN")).thenReturn(true);

    assertThatThrownBy(() -> service.create(1L, 1L, "fin", "Financeiro"))
        .isInstanceOf(BusinessException.class)
        .hasMessageContaining("Já existe um centro de custo");

    verify(repository, never()).save(any(CostCenter.class));
  }

  @Test
  @DisplayName("[INTEGRACAO][ASSET] CC-S02 - deactivate inexistente lança NotFoundException")
  void deactivateInexistenteLancaNotFound() {
    when(repository.findById(99L)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> service.deactivate(99L))
        .isInstanceOf(NotFoundException.class)
        .hasMessageContaining("Centro de custo não encontrado");
  }
}
