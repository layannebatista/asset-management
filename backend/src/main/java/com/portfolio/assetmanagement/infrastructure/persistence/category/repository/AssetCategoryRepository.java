package com.portfolio.assetmanagement.infrastructure.persistence.category.repository;

import com.portfolio.assetmanagement.domain.category.entity.AssetCategory;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AssetCategoryRepository extends JpaRepository<AssetCategory, Long> {

  Optional<AssetCategory> findByNameIgnoreCase(String name);

  boolean existsByNameIgnoreCase(String name);
}
