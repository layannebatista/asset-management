package com.portfolio.asset_management.inventory.entity;

import com.portfolio.asset_management.asset.entity.Asset;
import jakarta.persistence.*;

@Entity
@Table(name = "inventory_items")
public class InventoryItem {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(optional = false)
  @JoinColumn(name = "session_id", nullable = false)
  private InventorySession session;

  @ManyToOne(optional = false)
  @JoinColumn(name = "asset_id", nullable = false)
  private Asset asset;

  @Column(nullable = false)
  private boolean present;

  protected InventoryItem() {}

  public InventoryItem(InventorySession session, Asset asset, boolean present) {
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

  public void markPresent(boolean present) {
    this.present = present;
  }
}
