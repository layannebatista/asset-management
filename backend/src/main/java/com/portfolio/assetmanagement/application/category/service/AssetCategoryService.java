package com.portfolio.assetmanagement.application.category.service;

import com.portfolio.assetmanagement.domain.category.entity.AssetCategory;
import com.portfolio.assetmanagement.infrastructure.persistence.category.repository.AssetCategoryRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class AssetCategoryService {

  private final AssetCategoryRepository repository;

  public AssetCategoryService(AssetCategoryRepository repository) {
    this.repository = repository;
  }

  public AssetCategory create(String name, String description) {

    if (repository.existsByNameIgnoreCase(name)) {
      throw new IllegalStateException("Categoria já existe");
    }

    AssetCategory category = new AssetCategory(name, description);
    return repository.save(category);
  }

  public List<AssetCategory> findAll() {
    return repository.findAll();
  }

  public AssetCategory findById(Long id) {
    return repository
        .findById(id)
        .orElseThrow(() -> new IllegalArgumentException("Categoria não encontrada"));
  }

  public AssetCategory update(Long id, String name, String description) {

    AssetCategory category = findById(id);

    if (!category.getName().equalsIgnoreCase(name) && repository.existsByNameIgnoreCase(name)) {
      throw new IllegalStateException("Nome já utilizado");
    }

    category.update(name, description);

    return repository.save(category);
  }

  public void delete(Long id) {
    AssetCategory category = findById(id);
    category.deactivate();
    repository.save(category);
  }
}
