package com.portfolio.asset_management.inventory.entity;

import com.portfolio.asset_management.asset.entity.Asset;
import com.portfolio.asset_management.shared.exception.BusinessException;
import jakarta.persistence.*;

@Entity
@Table(
    name = "inventory_items",
    uniqueConstraints = {
      @UniqueConstraint(
          name = "uk_inventory_session_asset",
          columnNames = {"session_id", "asset_id"})
    },
    indexes = {
      @Index(name = "idx_inventory_item_session", columnList = "session_id"),
      @Index(name = "idx_inventory_item_asset", columnList = "asset_id")
    })
public class InventoryItem {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "session_id", nullable = false, updatable = false)
  private InventorySession session;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "asset_id", nullable = false, updatable = false)
  private Asset asset;

  @Column(nullable = false)
  private boolean present;

  protected InventoryItem() {}

  public InventoryItem(InventorySession session, Asset asset, boolean present) {

    if (session == null) {
      throw new IllegalArgumentException("session é obrigatório");
    }

    if (asset == null) {
      throw new IllegalArgumentException("asset é obrigatório");
    }

    if (!session.isActive()) {

      throw new BusinessException("Não é possível registrar item em sessão não ativa");
    }

    if (!asset.getOrganization().getId().equals(session.getOrganization().getId())) {

      throw new BusinessException("Asset não pertence à organization da sessão");
    }

    if (!asset.getUnit().getId().equals(session.getUnit().getId())) {

      throw new BusinessException("Asset não pertence à unit da sessão");
    }

    this.session = session;
    this.asset = asset;
    this.present = present;
  }

  public Long getId() {
    return id;
  }

  public InventorySession getSession() {
    return session;
  }

  public Asset getAsset() {
    return asset;
  }

  public boolean isPresent() {
    return present;
  }

  /** Marca presença do asset. */
  public void markPresent(boolean present) {

    if (!session.isActive()) {

      throw new BusinessException("Não é possível alterar item em sessão não ativa");
    }

    this.present = present;
  }

  /** Valida ownership multi-tenant. */
  public void validateOwnership(Long organizationId) {

    session.validateOwnership(organizationId);
  }
}
