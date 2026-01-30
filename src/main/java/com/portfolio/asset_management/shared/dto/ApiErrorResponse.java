package com.portfolio.asset_management.shared.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO responsável por padronizar as respostas de erro da API.
 *
 * <p>Utilizado para retornar erros de validação, regras de negócio e exceções tratadas de forma
 * consistente.
 */
public class ApiErrorResponse {

  private LocalDateTime timestamp;
  private int status;
  private String error;
  private List<FieldErrorDTO> fieldErrors;

  public ApiErrorResponse() {}

  public ApiErrorResponse(
      LocalDateTime timestamp, int status, String error, List<FieldErrorDTO> fieldErrors) {
    this.timestamp = timestamp;
    this.status = status;
    this.error = error;
    this.fieldErrors = fieldErrors;
  }

  public LocalDateTime getTimestamp() {
    return timestamp;
  }

  public void setTimestamp(LocalDateTime timestamp) {
    this.timestamp = timestamp;
  }

  public int getStatus() {
    return status;
  }

  public void setStatus(int status) {
    this.status = status;
  }

  public String getError() {
    return error;
  }

  public void setError(String error) {
    this.error = error;
  }

  public List<FieldErrorDTO> getFieldErrors() {
    return fieldErrors;
  }

  public void setFieldErrors(List<FieldErrorDTO> fieldErrors) {
    this.fieldErrors = fieldErrors;
  }
}
