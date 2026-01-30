package com.portfolio.asset_management.organization.dto;

import com.portfolio.asset_management.organization.enums.OrganizationStatus;

/**
 * DTO responsável por representar a resposta de uma organização.
 *
 * <p>Define os dados expostos pela API sobre a empresa (tenant), evitando o vazamento de
 * informações internas da entidade.
 */
public class OrganizationResponseDTO {

  private Long id;
  private String name;
  private OrganizationStatus status;

  public OrganizationResponseDTO() {}

  public OrganizationResponseDTO(Long id, String name, OrganizationStatus status) {
    this.id = id;
    this.name = name;
    this.status = status;
  }

  public Long getId() {
    return id;
  }

  public String getName() {
    return name;
  }

  public OrganizationStatus getStatus() {
    return status;
  }
}
