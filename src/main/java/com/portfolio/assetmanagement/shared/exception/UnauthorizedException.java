package com.portfolio.assetmanagement.shared.exception;

import com.portfolio.assetmanagement.shared.constants.ErrorCodes;
import java.util.List;

/**
 * Exceção lançada quando o usuário não está autenticado ou quando o token é inválido.
 *
 * <p>Exemplos: - JWT ausente - JWT inválido - JWT expirado - Sessão inexistente
 */
public class UnauthorizedException extends RuntimeException {

  private final String errorCode;

  private final List<String> details;

  /** Construtor padrão com mensagem. */
  public UnauthorizedException(String message) {

    super(message);

    this.errorCode = ErrorCodes.UNAUTHORIZED;

    this.details = null;
  }

  /** Construtor com código personalizado. */
  public UnauthorizedException(String errorCode, String message) {

    super(message);

    this.errorCode = errorCode;

    this.details = null;
  }

  /** Construtor com código e detalhes adicionais. */
  public UnauthorizedException(String errorCode, String message, List<String> details) {

    super(message);

    this.errorCode = errorCode;

    this.details = details;
  }

  /** Retorna código do erro. */
  public String getErrorCode() {

    return errorCode;
  }

  /** Retorna detalhes adicionais. */
  public List<String> getDetails() {

    return details;
  }
}
