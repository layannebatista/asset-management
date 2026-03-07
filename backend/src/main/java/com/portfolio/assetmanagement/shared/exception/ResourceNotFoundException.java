package com.portfolio.assetmanagement.shared.exception;

import java.util.List;

/**
 * B1: Agora estende NotFoundException. Mantida para retrocompatibilidade.
 *
 * @deprecated Use {@link NotFoundException} diretamente.
 */
@Deprecated(since = "1.1", forRemoval = true)
public class ResourceNotFoundException extends NotFoundException {

  public ResourceNotFoundException(String message) {
    super(message);
  }

  public ResourceNotFoundException(String errorCode, String message) {
    super(errorCode, message);
  }

  public ResourceNotFoundException(String errorCode, String message, List<String> details) {
    super(errorCode, message, details);
  }
}
