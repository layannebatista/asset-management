package com.portfolio.assetmanagement.domain.category.entity;

import jakarta.persistence.*;

@Entity
@Table(
    name = "asset_categories",
    uniqueConstraints = {@UniqueConstraint(name = "uk_category_name", columnNames = "name")})
public class AssetCategory {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Version private Long version;

  @Column(nullable = false, length = 100)
  private String name;

  @Column(length = 255)
  private String description;

  @Column(nullable = false)
  private boolean active = true;

  protected AssetCategory() {}

  public AssetCategory(String name, String description) {
    if (name == null || name.isBlank()) {
      throw new IllegalArgumentException("Name é obrigatório");
    }

    this.name = name;
    this.description = description;
  }

  public void update(String name, String description) {
    if (name == null || name.isBlank()) {
      throw new IllegalArgumentException("Name é obrigatório");
    }

    this.name = name;
    this.description = description;
  }

  public void deactivate() {
    if (!this.active) {
      throw new IllegalStateException("Categoria já está inativa");
    }
    this.active = false;
  }

  // =========================
  // GETTERS (necessários)
  // =========================

  public Long getId() {
    return id;
  }

  public Long getVersion() {
    return version;
  }

  public String getName() {
    return name;
  }

  public String getDescription() {
    return description;
  }

  public boolean isActive() {
    return active;
  }
}
