package com.portfolio.assetmanagement.shared.exception;

import com.portfolio.assetmanagement.shared.constants.ErrorCodes;
import java.util.List;

/**
 * B1: Unifica NotFoundException (simples) e ResourceNotFoundException (com errorCode/details).
 * ResourceNotFoundException passa a estender esta classe — zero breaking changes.
 */
public class NotFoundException extends RuntimeException {

  private final String errorCode;
  private final List<String> details;

  public NotFoundException(String message) {
    super(message);
    this.errorCode = ErrorCodes.RESOURCE_NOT_FOUND;
    this.details = null;
  }

  public NotFoundException(String errorCode, String message) {
    super(message);
    this.errorCode = errorCode;
    this.details = null;
  }

  public NotFoundException(String errorCode, String message, List<String> details) {
    super(message);
    this.errorCode = errorCode;
    this.details = details;
  }

  public String getErrorCode() {
    return errorCode;
  }

  public List<String> getDetails() {
    return details;
  }
}
