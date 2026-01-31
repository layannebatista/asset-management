package com.portfolio.asset_management.asset.entity;

import com.portfolio.asset_management.asset.enums.AssetStatus;
import com.portfolio.asset_management.asset.enums.AssetType;
import com.portfolio.asset_management.organization.entity.Organization;
import com.portfolio.asset_management.unit.entity.Unit;
import com.portfolio.asset_management.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * Entidade que representa um ativo no sistema.
 *
 * <p>O ativo pode ou não estar vinculado a um usuário, mas sempre pertence a uma organização e a
 * uma unidade.
 */
@Entity
@Table(name = "assets")
public class Asset {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  /** Identificador único do ativo no sistema (ex: número patrimonial). */
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

  protected Asset() {
    // Construtor protegido para uso do JPA
  }

  public Asset(
      String assetTag, AssetType type, String model, Organization organization, Unit unit) {

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

  public void setStatus(AssetStatus status) {
    this.status = status;
  }

  public void assignToUser(User user) {
    this.assignedUser = user;
    this.status = AssetStatus.ASSIGNED;
  }

  public void unassignUser() {
    this.assignedUser = null;
    this.status = AssetStatus.AVAILABLE;
  }

  public void changeUnit(Unit unit) {
    this.unit = unit;
  }
}
