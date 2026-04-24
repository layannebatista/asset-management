package com.portfolio.assetmanagement.unit.domain.category;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.portfolio.assetmanagement.domain.category.entity.AssetCategory;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("AssetCategory — domínio")
@Tag("testType=Unit")
@Tag("module=Domain")
class AssetCategoryEntityTest {

  @Test
  @DisplayName("CAT-U01 - construtor valida nome obrigatório")
  void construtorValidaNomeObrigatorio() {
    assertThatThrownBy(() -> new AssetCategory("   ", "desc"))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("Name é obrigatório");
  }

  @Test
  @DisplayName("CAT-U02 - deactivate torna categoria inativa")
  void deactivateTornaInativa() {
    AssetCategory category = new AssetCategory("Hardware", "desc");

    category.deactivate();

    assertThat(category.isActive()).isFalse();
  }

  @Test
  @DisplayName("CAT-U03 - deactivação dupla lança IllegalStateException")
  void deactivacaoDuplaLancaExcecao() {
    AssetCategory category = new AssetCategory("Hardware", "desc");
    category.deactivate();

    assertThatThrownBy(category::deactivate)
        .isInstanceOf(IllegalStateException.class)
        .hasMessageContaining("já está inativa");
  }
}
