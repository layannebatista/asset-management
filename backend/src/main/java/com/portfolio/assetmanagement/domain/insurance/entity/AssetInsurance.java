package com.portfolio.assetmanagement.domain.insurance.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

/**
 * Apólice de seguro vinculada a um ativo.
 *
 * <p>Seguradoras e bancos exigem rastreabilidade de cobertura por ativo. Este registro permite:
 * consultar cobertura ativa, emitir alertas de vencimento e calcular o valor total assegurado do
 * portfólio.
 */
@Entity
@Table(
    name = "asset_insurance",
    indexes = {
      @Index(name = "idx_ins_asset", columnList = "asset_id"),
      @Index(name = "idx_ins_expiry", columnList = "expiry_date")
    })
public class AssetInsurance {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "asset_id", nullable = false)
  private Long assetId;

  @Column(name = "organization_id", nullable = false)
  private Long organizationId;

  @Column(name = "policy_number", nullable = false, length = 100)
  private String policyNumber;

  @Column(nullable = false, length = 255)
  private String insurer;

  @Column(name = "coverage_value", nullable = false, precision = 15, scale = 2)
  private BigDecimal coverageValue;

  @Column(precision = 15, scale = 2)
  private BigDecimal premium;

  @Column(name = "start_date", nullable = false)
  private LocalDate startDate;

  @Column(name = "expiry_date", nullable = false)
  private LocalDate expiryDate;

  @Column(nullable = false)
  private boolean active;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  protected AssetInsurance() {}

  public AssetInsurance(
      Long assetId,
      Long organizationId,
      String policyNumber,
      String insurer,
      BigDecimal coverageValue,
      BigDecimal premium,
      LocalDate startDate,
      LocalDate expiryDate) {
    if (assetId == null) throw new IllegalArgumentException("assetId é obrigatório");
    if (policyNumber == null) throw new IllegalArgumentException("policyNumber é obrigatório");
    if (insurer == null) throw new IllegalArgumentException("insurer é obrigatório");
    if (coverageValue == null) throw new IllegalArgumentException("coverageValue é obrigatório");
    if (startDate == null) throw new IllegalArgumentException("startDate é obrigatório");
    if (expiryDate == null) throw new IllegalArgumentException("expiryDate é obrigatório");
    if (!expiryDate.isAfter(startDate))
      throw new IllegalArgumentException("expiryDate deve ser posterior a startDate");

    this.assetId = assetId;
    this.organizationId = organizationId;
    this.policyNumber = policyNumber;
    this.insurer = insurer;
    this.coverageValue = coverageValue;
    this.premium = premium;
    this.startDate = startDate;
    this.expiryDate = expiryDate;
    this.active = true;
    this.createdAt = Instant.now();
  }

  public boolean isExpired() {
    return LocalDate.now().isAfter(expiryDate);
  }

  public boolean isExpiringSoon(int daysThreshold) {
    LocalDate threshold = LocalDate.now().plusDays(daysThreshold);
    return !isExpired() && !expiryDate.isAfter(threshold);
  }

  public void deactivate() {
    this.active = false;
  }

  public Long getId() {
    return id;
  }

  public Long getAssetId() {
    return assetId;
  }

  public Long getOrganizationId() {
    return organizationId;
  }

  public String getPolicyNumber() {
    return policyNumber;
  }

  public String getInsurer() {
    return insurer;
  }

  public BigDecimal getCoverageValue() {
    return coverageValue;
  }

  public BigDecimal getPremium() {
    return premium;
  }

  public LocalDate getStartDate() {
    return startDate;
  }

  public LocalDate getExpiryDate() {
    return expiryDate;
  }

  public boolean isActive() {
    return active;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }
}
