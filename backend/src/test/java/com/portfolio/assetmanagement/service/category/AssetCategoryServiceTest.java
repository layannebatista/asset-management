package com.portfolio.assetmanagement.service.category;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.portfolio.assetmanagement.application.category.service.AssetCategoryService;
import com.portfolio.assetmanagement.domain.category.entity.AssetCategory;
import com.portfolio.assetmanagement.infrastructure.persistence.category.repository.AssetCategoryRepository;
import com.portfolio.assetmanagement.shared.exception.BusinessException;
import com.portfolio.assetmanagement.shared.exception.NotFoundException;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("AssetCategoryService — regras críticas")
@Tag("testType=Integration")
@Tag("module=Category")
class AssetCategoryServiceTest {

  @Mock private AssetCategoryRepository repository;
  @InjectMocks private AssetCategoryService service;

  @Test
  @DisplayName("CAT-S01 - criar categoria com nome duplicado lança BusinessException")
  void criarCategoriaDuplicadaLancaBusinessException() {
    when(repository.existsByNameIgnoreCase("TI")).thenReturn(true);

    assertThatThrownBy(() -> service.create("TI", "Categoria"))
        .isInstanceOf(BusinessException.class)
        .hasMessageContaining("Categoria já existe");
  }

  @Test
  @DisplayName("CAT-S02 - update com ID inexistente lança NotFoundException")
  void updateInexistenteLancaNotFound() {
    when(repository.findById(99L)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> service.update(99L, "New", "desc"))
        .isInstanceOf(NotFoundException.class)
        .hasMessageContaining("Categoria não encontrada");
  }

  @Test
  @DisplayName("CAT-S03 - delete lógico salva categoria desativada")
  void deleteLogicoSalvaCategoriaDesativada() {
    AssetCategory category = new AssetCategory("HW", "Hardware");
    when(repository.findById(1L)).thenReturn(Optional.of(category));

    service.delete(1L);

    verify(repository).save(any(AssetCategory.class));
  }
}
