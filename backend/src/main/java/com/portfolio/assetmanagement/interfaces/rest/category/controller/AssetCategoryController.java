package com.portfolio.assetmanagement.interfaces.rest.category.controller;

import com.portfolio.assetmanagement.application.category.dto.*;
import com.portfolio.assetmanagement.application.category.service.AssetCategoryService;
import com.portfolio.assetmanagement.domain.category.entity.AssetCategory;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Categories", description = "Gerenciamento de categorias de ativos")
@RestController
@RequestMapping("/categories")
public class AssetCategoryController {

  private final AssetCategoryService service;

  public AssetCategoryController(AssetCategoryService service) {
    this.service = service;
  }

  @Operation(summary = "Criar categoria")
  @PostMapping
  public CategoryResponseDTO create(@RequestBody @Valid CategoryRequestDTO dto) {

    AssetCategory category = service.create(dto.getName(), dto.getDescription());

    return map(category);
  }

  @Operation(summary = "Listar categorias")
  @GetMapping
  public List<CategoryResponseDTO> list() {
    return service.findAll().stream().map(this::map).toList();
  }

  @Operation(summary = "Buscar categoria por ID")
  @GetMapping("/{id}")
  public CategoryResponseDTO findById(@PathVariable Long id) {
    return map(service.findById(id));
  }

  @Operation(summary = "Atualizar categoria (PUT completo)")
  @PutMapping("/{id}")
  public CategoryResponseDTO update(
      @PathVariable Long id, @RequestBody @Valid CategoryRequestDTO dto) {

    return map(service.update(id, dto.getName(), dto.getDescription()));
  }

  @Operation(summary = "Desativar categoria (DELETE lógico)")
  @DeleteMapping("/{id}")
  public void delete(@PathVariable Long id) {
    service.delete(id);
  }

  private CategoryResponseDTO map(AssetCategory category) {
    return new CategoryResponseDTO(
        category.getId(), category.getName(), category.getDescription(), category.isActive());
  }
}
