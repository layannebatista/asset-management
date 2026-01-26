package com.portfolio.asset_management.api.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

  /* ======================================================
  ERROS DE REGRA DE NEGÓCIO
  ====================================================== */

  @ExceptionHandler(IllegalStateException.class)
  public ResponseEntity<ApiError> handleIllegalState(
      IllegalStateException ex, HttpServletRequest request) {
    ApiError error =
        new ApiError(
            HttpStatus.CONFLICT.value(),
            "Regra de negócio violada",
            ex.getMessage(),
            request.getRequestURI());

    return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
  }

  /* ======================================================
  ERROS DE VALIDAÇÃO / ARGUMENTOS
  ====================================================== */

  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<ApiError> handleIllegalArgument(
      IllegalArgumentException ex, HttpServletRequest request) {
    ApiError error =
        new ApiError(
            HttpStatus.BAD_REQUEST.value(),
            "Requisição inválida",
            ex.getMessage(),
            request.getRequestURI());

    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
  }

  /* ======================================================
  ERROS NÃO TRATADOS (FALLBACK)
  ====================================================== */

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiError> handleGenericException(Exception ex, HttpServletRequest request) {
    ApiError error =
        new ApiError(
            HttpStatus.INTERNAL_SERVER_ERROR.value(),
            "Erro interno",
            "Ocorreu um erro inesperado no servidor",
            request.getRequestURI());

    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
  }
}
