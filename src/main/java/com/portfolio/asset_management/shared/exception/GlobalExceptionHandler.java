package com.portfolio.asset_management.shared.exception;

import com.portfolio.asset_management.shared.dto.ApiErrorResponse;
import com.portfolio.asset_management.shared.dto.FieldErrorDTO;
import jakarta.validation.ConstraintViolationException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Handler global de exceções da aplicação.
 *
 * <p>Responsável por interceptar exceções lançadas pelos controllers e convertê-las em respostas
 * padronizadas para a API.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ApiErrorResponse> handleMethodArgumentNotValidException(
      MethodArgumentNotValidException ex) {

    List<FieldErrorDTO> fieldErrors =
        ex.getBindingResult().getFieldErrors().stream()
            .map(this::mapToFieldErrorDTO)
            .collect(Collectors.toList());

    ApiErrorResponse response =
        new ApiErrorResponse(
            LocalDateTime.now(), HttpStatus.BAD_REQUEST.value(), "Erro de validação", fieldErrors);

    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
  }

  @ExceptionHandler(ConstraintViolationException.class)
  public ResponseEntity<ApiErrorResponse> handleConstraintViolationException(
      ConstraintViolationException ex) {

    List<FieldErrorDTO> fieldErrors =
        ex.getConstraintViolations().stream()
            .map(
                violation ->
                    new FieldErrorDTO(
                        violation.getPropertyPath().toString(), violation.getMessage()))
            .collect(Collectors.toList());

    ApiErrorResponse response =
        new ApiErrorResponse(
            LocalDateTime.now(), HttpStatus.BAD_REQUEST.value(), "Erro de validação", fieldErrors);

    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
  }

  private FieldErrorDTO mapToFieldErrorDTO(FieldError fieldError) {
    return new FieldErrorDTO(fieldError.getField(), fieldError.getDefaultMessage());
  }
}
