package com.portfolio.assetmanagement.application.organization.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * DTO responsável por representar a requisição de criação de uma organização.
 *
 * <p>Contém apenas os dados necessários para criação da empresa no sistema. Não executa regras de
 * negócio.
 */
public class OrganizationCreateDTO {

  @NotBlank(message = "Nome da organização é obrigatório")
  private String name;

  public OrganizationCreateDTO() {}

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }
}