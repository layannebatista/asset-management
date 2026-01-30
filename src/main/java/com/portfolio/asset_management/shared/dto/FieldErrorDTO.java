package com.portfolio.asset_management.shared.dto;

/**
 * DTO responsável por representar um erro associado a um campo específico.
 *
 * <p>Utilizado principalmente em erros de validação para indicar qual campo apresentou problema e a
 * mensagem correspondente.
 */
public class FieldErrorDTO {

  private String field;
  private String message;

  public FieldErrorDTO() {}

  public FieldErrorDTO(String field, String message) {
    this.field = field;
    this.message = message;
  }

  public String getField() {
    return field;
  }

  public void setField(String field) {
    this.field = field;
  }

  public String getMessage() {
    return message;
  }

  public void setMessage(String message) {
    this.message = message;
  }
}
