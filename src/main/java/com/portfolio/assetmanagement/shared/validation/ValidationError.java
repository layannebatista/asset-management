package com.portfolio.assetmanagement.shared.validation;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Representa um erro de validação específico de um campo.
 *
 * <p>Exemplo:
 *
 * <p>{ "field": "assetTag", "message": "assetTag é obrigatório", "code": "VALIDATION_ERROR" }
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ValidationError {

  private final String field;

  private final String message;

  private final String code;

  /** Construtor principal. */
  public ValidationError(String field, String message, String code) {

    this.field = field;
    this.message = message;
    this.code = code;
  }

  /** Nome do campo com erro. */
  public String getField() {

    return field;
  }

  /** Mensagem descritiva do erro. */
  public String getMessage() {

    return message;
  }

  /** Código padronizado do erro. */
  public String getCode() {

    return code;
  }
}
