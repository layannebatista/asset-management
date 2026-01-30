package com.portfolio.asset_management.unit.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * DTO responsável por representar a requisição de criação de uma unidade (filial).
 *
 * <p>Contém apenas os dados necessários para criação da unidade no sistema. Não executa regras de
 * negócio.
 */
public class UnitCreateDTO {

  @NotBlank(message = "Nome da unidade é obrigatório")
  private String name;

  public UnitCreateDTO() {}

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }
}
