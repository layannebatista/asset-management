package com.portfolio.assetmanagement.domain.asset.entity;

import com.portfolio.assetmanagement.domain.asset.enums.AssetStatus;
import com.portfolio.assetmanagement.domain.asset.enums.AssetType;
import com.portfolio.assetmanagement.domain.depreciation.enums.DepreciationMethod;
import com.portfolio.assetmanagement.domain.organization.entity.Organization;
import com.portfolio.assetmanagement.domain.unit.entity.Unit;
import com.portfolio.assetmanagement.domain.user.entity.User;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "assets")
public class Asset {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  /**
   * Controle de concorrência otimista.
   *
   * <p>Impede que duas transações modifiquem o mesmo ativo simultaneamente. Hibernate usa este
   * campo automaticamente.
   */
  @Version
  @Column(nullable = false)
  private Long version;

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

  /** Versão usada pelo Hibernate para optimistic locking. */
  public Long getVersion() {
    return version;
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

  /**
   * Completa transferência de unidade de forma atômica.
   *
   * <p>Atualiza unidade e status em uma única operação, eliminando o estado intermediário
   * IN_TRANSFER inconsistente.
   */
  public void completeTransfer(Unit newUnit) {

    if (newUnit == null) {
      throw new IllegalArgumentException("unit é obrigatório");
    }

    this.unit = newUnit;
    this.status = AssetStatus.AVAILABLE;
  }

  /** Aposenta ativo. */
  public void retire() {

    if (this.status == AssetStatus.RETIRED) {
      throw new IllegalArgumentException("Ativo já está aposentado");
    }

    this.assignedUser = null;
    this.status = AssetStatus.RETIRED;
  }

  @Column(name = "purchase_date")
  private LocalDate purchaseDate;

  @Column(name = "invoice_number", length = 100)
  private String invoiceNumber;

  @Column(name = "invoice_date")
  private LocalDate invoiceDate;

  @Column(length = 255)
  private String supplier;

  @Column(name = "warranty_expiry")
  private LocalDate warrantyExpiry;

  // ─── Depreciação (Financeiro) ────────────────────────────────

  @Column(name = "purchase_value", precision = 15, scale = 2)
  private BigDecimal purchaseValue;

  @Column(name = "residual_value", precision = 15, scale = 2)
  private BigDecimal residualValue;

  @Column(name = "useful_life_months")
  private Integer usefulLifeMonths;

  @Enumerated(EnumType.STRING)
  @Column(name = "depreciation_method", length = 30)
  private DepreciationMethod depreciationMethod;

  // ─── Centro de Custo ────────────────────────────────────────

  @Column(name = "cost_center_id")
  private Long costCenterId;

  public LocalDate getPurchaseDate() {
    return purchaseDate;
  }

  public void setPurchaseDate(LocalDate v) {
    this.purchaseDate = v;
  }

  public String getInvoiceNumber() {
    return invoiceNumber;
  }

  public void setInvoiceNumber(String v) {
    this.invoiceNumber = v;
  }

  public LocalDate getInvoiceDate() {
    return invoiceDate;
  }

  public void setInvoiceDate(LocalDate v) {
    this.invoiceDate = v;
  }

  public String getSupplier() {
    return supplier;
  }

  public void setSupplier(String v) {
    this.supplier = v;
  }

  public LocalDate getWarrantyExpiry() {
    return warrantyExpiry;
  }

  public void setWarrantyExpiry(LocalDate v) {
    this.warrantyExpiry = v;
  }

  public BigDecimal getPurchaseValue() {
    return purchaseValue;
  }

  public void setPurchaseValue(BigDecimal v) {
    this.purchaseValue = v;
  }

  public BigDecimal getResidualValue() {
    return residualValue;
  }

  public void setResidualValue(BigDecimal v) {
    this.residualValue = v;
  }

  public Integer getUsefulLifeMonths() {
    return usefulLifeMonths;
  }

  public void setUsefulLifeMonths(Integer v) {
    this.usefulLifeMonths = v;
  }

  public DepreciationMethod getDepreciationMethod() {
    return depreciationMethod;
  }

  public void setDepreciationMethod(DepreciationMethod v) {
    this.depreciationMethod = v;
  }

  public Long getCostCenterId() {
    return costCenterId;
  }

  public void setCostCenterId(Long v) {
    this.costCenterId = v;
  }
}
