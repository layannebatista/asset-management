package com.portfolio.asset_management.domain.inventory;

import jakarta.persistence.*;

@Entity
@Table(name = "inventory_items")
public class InventoryItem {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  private Long assetId;

  private Long cycleId;

  private boolean checked;
}
