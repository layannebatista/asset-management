package com.portfolio.asset_management.security.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * DTO responsável por representar a requisição de login.
 *
 * <p>Contém apenas os dados necessários para autenticação do usuário. Não executa nenhuma lógica de
 * autenticação.
 */
public class LoginRequestDTO {

  @NotBlank(message = "Email é obrigatório")
  @Email(message = "Email inválido")
  private String email;

  @NotBlank(message = "Senha é obrigatória")
  private String password;

  public LoginRequestDTO() {}

  public String getEmail() {
    return email;
  }

  public void setEmail(String email) {
    this.email = email;
  }

  public String getPassword() {
    return password;
  }

  public void setPassword(String password) {
    this.password = password;
  }
}
