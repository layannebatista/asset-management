package com.portfolio.asset_management.asset.entity;

import com.portfolio.asset_management.asset.enums.AssetStatus;
import com.portfolio.asset_management.asset.enums.AssetType;
import com.portfolio.asset_management.organization.entity.Organization;
import com.portfolio.asset_management.unit.entity.Unit;
import com.portfolio.asset_management.user.entity.User;
import jakarta.persistence.*;

@Entity
@Table(name = "assets")
public class Asset {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true)
  private String assetTag;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private AssetType type;

  @Column(nullable = false)
  private String model;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private AssetStatus status;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "organization_id", nullable = false)
  private Organization organization;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "unit_id", nullable = false)
  private Unit unit;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id")
  private User assignedUser;

  protected Asset() {}

  public Asset(
      String assetTag, AssetType type, String model, Organization organization, Unit unit) {

    if (assetTag == null || assetTag.isBlank()) {
      throw new IllegalArgumentException("assetTag é obrigatório");
    }

    if (type == null) {
      throw new IllegalArgumentException("type é obrigatório");
    }

    if (model == null || model.isBlank()) {
      throw new IllegalArgumentException("model é obrigatório");
    }

    if (organization == null) {
      throw new IllegalArgumentException("organization é obrigatório");
    }

    if (unit == null) {
      throw new IllegalArgumentException("unit é obrigatório");
    }

    this.assetTag = assetTag;
    this.type = type;
    this.model = model;
    this.organization = organization;
    this.unit = unit;
    this.status = AssetStatus.AVAILABLE;
  }

  public Long getId() {
    return id;
  }

  public String getAssetTag() {
    return assetTag;
  }

  public AssetType getType() {
    return type;
  }

  public String getModel() {
    return model;
  }

  public AssetStatus getStatus() {
    return status;
  }

  public Organization getOrganization() {
    return organization;
  }

  public Unit getUnit() {
    return unit;
  }

  public User getAssignedUser() {
    return assignedUser;
  }

  /** Método controlado para mudança de status. Necessário para maintenance, transfer, etc. */
  public void changeStatus(AssetStatus status) {

    if (status == null) {
      throw new IllegalArgumentException("status é obrigatório");
    }

    this.status = status;
  }

  /** Atribui ativo a usuário. */
  public void assignToUser(User user) {

    if (user == null) {
      throw new IllegalArgumentException("user é obrigatório");
    }

    this.assignedUser = user;
    this.status = AssetStatus.ASSIGNED;
  }

  /** Remove atribuição. */
  public void unassignUser() {

    this.assignedUser = null;
    this.status = AssetStatus.AVAILABLE;
  }

  /** Transferência de unidade. */
  public void changeUnit(Unit unit) {

    if (unit == null) {
      throw new IllegalArgumentException("unit é obrigatório");
    }

    this.unit = unit;
    this.status = AssetStatus.IN_TRANSFER;
  }

  /** Aposenta ativo. */
  public void retire() {

    if (this.status == AssetStatus.RETIRED) {
      return;
    }

    this.assignedUser = null;
    this.status = AssetStatus.RETIRED;
  }
}
