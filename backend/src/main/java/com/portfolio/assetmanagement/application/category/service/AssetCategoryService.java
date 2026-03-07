package com.portfolio.assetmanagement.application.category.service;

import com.portfolio.assetmanagement.domain.category.entity.AssetCategory;
import com.portfolio.assetmanagement.infrastructure.persistence.category.repository.AssetCategoryRepository;
import com.portfolio.assetmanagement.shared.exception.BusinessException;
import com.portfolio.assetmanagement.shared.exception.NotFoundException;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AssetCategoryService {

  private final AssetCategoryRepository repository;

  public AssetCategoryService(AssetCategoryRepository repository) {
    this.repository = repository;
  }

  @Transactional
  public AssetCategory create(String name, String description) {

    if (repository.existsByNameIgnoreCase(name)) {
      throw new BusinessException("Categoria já existe");
    }

    AssetCategory category = new AssetCategory(name, description);

    return repository.save(category);
  }

  // D2: adicionado @Transactional(readOnly = true) — habilita flush mode MANUAL e
  // desativa snapshots do Hibernate, reduzindo overhead em listas potencialmente grandes.
  @Transactional(readOnly = true)
  public List<AssetCategory> findAll() {
    return repository.findAll();
  }

  // D2: mesmo motivo — findById é chamado por update() e delete() que têm sua própria
  // transação de escrita; quando chamado isoladamente merece readOnly.
  @Transactional(readOnly = true)
  public AssetCategory findById(Long id) {

    return repository
        .findById(id)
        .orElseThrow(() -> new NotFoundException("Categoria não encontrada"));
  }

  @Transactional
  public AssetCategory update(Long id, String name, String description) {

    AssetCategory category = findById(id);

    if (!category.getName().equalsIgnoreCase(name) && repository.existsByNameIgnoreCase(name)) {
      throw new BusinessException("Nome já utilizado");
    }

    category.update(name, description);

    return repository.save(category);
  }

  @Transactional
  public void delete(Long id) {

    AssetCategory category = findById(id);

    category.deactivate();

    repository.save(category);
  }
}
