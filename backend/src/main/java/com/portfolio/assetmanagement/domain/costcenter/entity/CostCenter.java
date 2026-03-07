package com.portfolio.assetmanagement.domain.costcenter.entity;

import jakarta.persistence.*;

/**
 * Centro de custo organizacional.
 *
 * <p>Estrutura financeira que permite alocar ativos e manutenções a departamentos/projetos para
 * controle de OPEX e CAPEX.
 *
 * <p>Bancos e empresas de grande porte usam centros de custo para:
 *
 * <ul>
 *   <li>Chargeback de TI — cobrar departamentos pelo uso de equipamentos
 *   <li>Controle de orçamento por área
 *   <li>Relatórios de custo para auditores e board
 * </ul>
 */
@Entity
@Table(
    name = "cost_centers",
    uniqueConstraints = @UniqueConstraint(columnNames = {"organization_id", "code"}))
public class CostCenter {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "organization_id", nullable = false)
  private Long organizationId;

  @Column(name = "unit_id")
  private Long unitId;

  @Column(nullable = false, length = 50)
  private String code;

  @Column(nullable = false, length = 255)
  private String name;

  @Column(nullable = false)
  private boolean active;

  protected CostCenter() {}

  public CostCenter(Long organizationId, Long unitId, String code, String name) {
    if (organizationId == null) throw new IllegalArgumentException("organizationId obrigatório");
    if (code == null || code.isBlank()) throw new IllegalArgumentException("code obrigatório");
    if (name == null || name.isBlank()) throw new IllegalArgumentException("name obrigatório");
    this.organizationId = organizationId;
    this.unitId = unitId;
    this.code = code.toUpperCase().trim();
    this.name = name.trim();
    this.active = true;
  }

  public void deactivate() {
    this.active = false;
  }

  public void activate() {
    this.active = true;
  }

  public Long getId() {
    return id;
  }

  public Long getOrganizationId() {
    return organizationId;
  }

  public Long getUnitId() {
    return unitId;
  }

  public String getCode() {
    return code;
  }

  public String getName() {
    return name;
  }

  public boolean isActive() {
    return active;
  }
}
