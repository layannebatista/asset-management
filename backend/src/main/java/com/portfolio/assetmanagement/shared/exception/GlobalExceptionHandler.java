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
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@RestControllerAdvice
public class GlobalExceptionHandler {

  private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

  /**
   * B1: Handler único — captura NotFoundException e sua subclasse ResourceNotFoundException. A
   * versão anterior tinha dois @ExceptionHandler separados para classes independentes.
   */
  @ExceptionHandler(NotFoundException.class)
  public ResponseEntity<ApiResponse<Void>> handleNotFoundException(
      NotFoundException ex, HttpServletRequest request) {
    log.warn("Resource not found: {}", ex.getMessage());
    return ResponseEntity.status(HttpStatus.NOT_FOUND)
        .body(ApiResponse.error(new ErrorResponse(ErrorCodes.RESOURCE_NOT_FOUND, ex.getMessage())));
  }

  @ExceptionHandler(BusinessException.class)
  public ResponseEntity<ApiResponse<Void>> handleBusinessException(
      BusinessException ex, HttpServletRequest request) {
    log.warn("Business rule violation: {}", ex.getMessage());
    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
        .body(
            ApiResponse.error(
                new ErrorResponse(ErrorCodes.BUSINESS_RULE_VIOLATION, ex.getMessage())));
  }

  @ExceptionHandler(ConcurrencyException.class)
  public ResponseEntity<ApiResponse<Void>> handleConcurrencyException(
      ConcurrencyException ex, HttpServletRequest request) {
    log.warn("Concurrency conflict: {}", ex.getMessage());
    return ResponseEntity.status(HttpStatus.CONFLICT)
        .body(
            ApiResponse.error(
                new ErrorResponse(ErrorCodes.BUSINESS_RULE_VIOLATION, ex.getMessage())));
  }

  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<ApiResponse<Void>> handleIllegalArgument(
      IllegalArgumentException ex, HttpServletRequest request) {
    log.warn("Invalid argument: {}", ex.getMessage());
    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
        .body(ApiResponse.error(new ErrorResponse(ErrorCodes.VALIDATION_ERROR, ex.getMessage())));
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ApiResponse<Void>> handleMethodArgumentNotValid(
      MethodArgumentNotValidException ex, HttpServletRequest request) {
    List<String> details = new ArrayList<>();
    for (FieldError fe : ex.getBindingResult().getFieldErrors())
      details.add(fe.getField() + ": " + fe.getDefaultMessage());
    log.warn("Validation error: {}", details);
    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
        .body(
            ApiResponse.error(
                new ErrorResponse(ErrorCodes.VALIDATION_ERROR, "Validation failed", details)));
  }

  @ExceptionHandler(MissingServletRequestParameterException.class)
  public ResponseEntity<ApiResponse<Void>> handleMissingRequestParameter(
      MissingServletRequestParameterException ex, HttpServletRequest request) {
    String detail = ex.getParameterName() + ": parâmetro obrigatório não informado";
    log.warn("Missing request parameter: {}", detail);
    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
        .body(
            ApiResponse.error(
                new ErrorResponse(ErrorCodes.VALIDATION_ERROR, "Validation failed", List.of(detail))));
  }

  @ExceptionHandler(ValidationException.class)
  public ResponseEntity<ApiResponse<Void>> handleValidationException(
      ValidationException ex, HttpServletRequest request) {
    log.warn("Validation exception: {}", ex.getMessage());
    List<String> details =
        ex.getFieldErrors() != null && !ex.getFieldErrors().isEmpty()
            ? ex.getFieldErrors().stream()
                .map(fe -> fe.getField() + ": " + fe.getMessage())
                .toList()
            : null;
    ErrorResponse error =
        details != null
            ? new ErrorResponse(ErrorCodes.VALIDATION_ERROR, ex.getMessage(), details)
            : new ErrorResponse(ErrorCodes.VALIDATION_ERROR, ex.getMessage());
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(error));
  }

  @ExceptionHandler(AuthenticationException.class)
  public ResponseEntity<ApiResponse<Void>> handleAuthenticationException(
      AuthenticationException ex, HttpServletRequest request) {
    log.warn("Authentication failure: {}", ex.getMessage());
    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
        .body(ApiResponse.error(new ErrorResponse(ErrorCodes.UNAUTHORIZED, ex.getMessage())));
  }

  @ExceptionHandler(UnauthorizedException.class)
  public ResponseEntity<ApiResponse<Void>> handleUnauthorized(
      UnauthorizedException ex, HttpServletRequest request) {
    log.warn("Unauthorized access: {}", ex.getMessage());
    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
        .body(ApiResponse.error(new ErrorResponse(ErrorCodes.UNAUTHORIZED, ex.getMessage())));
  }

  @ExceptionHandler(BadCredentialsException.class)
  public ResponseEntity<ApiResponse<Void>> handleBadCredentials(
      BadCredentialsException ex, HttpServletRequest request) {
    log.warn("Bad credentials: {}", ex.getMessage());
    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
        .body(ApiResponse.error(new ErrorResponse(ErrorCodes.UNAUTHORIZED, ex.getMessage())));
  }

  @ExceptionHandler(DisabledException.class)
  public ResponseEntity<ApiResponse<Void>> handleDisabledException(
      DisabledException ex, HttpServletRequest request) {
    log.warn("Disabled user attempt: {}", ex.getMessage());
    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
        .body(ApiResponse.error(new ErrorResponse(ErrorCodes.UNAUTHORIZED, ex.getMessage())));
  }

  @ExceptionHandler({ForbiddenException.class, AccessDeniedException.class})
  public ResponseEntity<ApiResponse<Void>> handleForbidden(
      Exception ex, HttpServletRequest request) {
    log.warn("Forbidden access: {}", ex.getMessage());
    return ResponseEntity.status(HttpStatus.FORBIDDEN)
        .body(ApiResponse.error(new ErrorResponse(ErrorCodes.FORBIDDEN, ex.getMessage())));
  }

  @ExceptionHandler(DataIntegrityViolationException.class)
  public ResponseEntity<ApiResponse<Void>> handleDataIntegrity(
      DataIntegrityViolationException ex, HttpServletRequest request) {
    log.error("Database integrity violation", ex);
    return ResponseEntity.status(HttpStatus.CONFLICT)
        .body(
            ApiResponse.error(
                new ErrorResponse(
                    ErrorCodes.BUSINESS_RULE_VIOLATION, "Database integrity violation")));
  }

  @ExceptionHandler(NoResourceFoundException.class)
  public ResponseEntity<ApiResponse<Void>> handleNoResourceFound(
      NoResourceFoundException ex, HttpServletRequest request) {
    return ResponseEntity.status(HttpStatus.NOT_FOUND)
        .body(ApiResponse.error(new ErrorResponse(ErrorCodes.RESOURCE_NOT_FOUND, ex.getMessage())));
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiResponse<Void>> handleGenericException(
      Exception ex, HttpServletRequest request) {
    log.error("Unhandled exception", ex);
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(
            ApiResponse.error(
                new ErrorResponse(ErrorCodes.INTERNAL_ERROR, "Internal server error")));
  }
}
