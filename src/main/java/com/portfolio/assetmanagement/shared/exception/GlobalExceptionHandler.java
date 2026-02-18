package com.portfolio.assetmanagement.shared.exception;

import com.portfolio.assetmanagement.shared.constants.ErrorCodes;
import com.portfolio.assetmanagement.shared.response.ApiResponse;
import com.portfolio.assetmanagement.shared.response.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

  private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

  /** RESOURCE NOT FOUND */
  @ExceptionHandler(ResourceNotFoundException.class)
  public ResponseEntity<ApiResponse<Void>> handleResourceNotFound(
      ResourceNotFoundException ex, HttpServletRequest request) {

    log.warn("Resource not found: {}", ex.getMessage());

    ErrorResponse error = new ErrorResponse(ErrorCodes.RESOURCE_NOT_FOUND, ex.getMessage());

    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(error));
  }

  /** BUSINESS RULE VIOLATION */
  @ExceptionHandler(BusinessException.class)
  public ResponseEntity<ApiResponse<Void>> handleBusinessException(
      BusinessException ex, HttpServletRequest request) {

    log.warn("Business rule violation: {}", ex.getMessage());

    ErrorResponse error = new ErrorResponse(ErrorCodes.BUSINESS_RULE_VIOLATION, ex.getMessage());

    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(error));
  }

  /** VALIDATION ERRORS (@Valid) */
  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ApiResponse<Void>> handleValidationException(
      MethodArgumentNotValidException ex, HttpServletRequest request) {

    List<String> details = new ArrayList<>();

    for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {

      details.add(fieldError.getField() + ": " + fieldError.getDefaultMessage());
    }

    log.warn("Validation error: {}", details);

    ErrorResponse error =
        new ErrorResponse(ErrorCodes.VALIDATION_ERROR, "Validation failed", details);

    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(error));
  }

  /** UNAUTHORIZED */
  @ExceptionHandler(UnauthorizedException.class)
  public ResponseEntity<ApiResponse<Void>> handleUnauthorized(
      UnauthorizedException ex, HttpServletRequest request) {

    log.warn("Unauthorized access: {}", ex.getMessage());

    ErrorResponse error = new ErrorResponse(ErrorCodes.UNAUTHORIZED, ex.getMessage());

    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error(error));
  }

  /** FORBIDDEN */
  @ExceptionHandler({ForbiddenException.class, AccessDeniedException.class})
  public ResponseEntity<ApiResponse<Void>> handleForbidden(
      Exception ex, HttpServletRequest request) {

    log.warn("Forbidden access: {}", ex.getMessage());

    ErrorResponse error = new ErrorResponse(ErrorCodes.FORBIDDEN, ex.getMessage());

    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(error));
  }

  /** DATABASE INTEGRITY */
  @ExceptionHandler(DataIntegrityViolationException.class)
  public ResponseEntity<ApiResponse<Void>> handleDataIntegrity(
      DataIntegrityViolationException ex, HttpServletRequest request) {

    log.error("Database integrity violation", ex);

    ErrorResponse error =
        new ErrorResponse(ErrorCodes.BUSINESS_RULE_VIOLATION, "Database integrity violation");

    return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error(error));
  }

  /** GENERIC FALLBACK */
  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiResponse<Void>> handleGenericException(
      Exception ex, HttpServletRequest request) {

    log.error("Unhandled exception", ex);

    ErrorResponse error = new ErrorResponse(ErrorCodes.INTERNAL_ERROR, "Internal server error");

    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.error(error));
  }
}