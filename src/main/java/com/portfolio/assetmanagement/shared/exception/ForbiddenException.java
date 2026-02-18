package com.portfolio.assetmanagement.shared.exception;

import com.portfolio.assetmanagement.shared.constants.ErrorCodes;
import java.util.List;

/**
 * Exceção lançada quando o usuário está autenticado, mas não tem permissão para executar a ação.
 *
 * <p>Exemplos: - acessar recurso de outro tenant - acessar recurso sem role adequada - tentar
 * modificar recurso protegido - violação de RBAC ou ABAC
 */
public class ForbiddenException extends RuntimeException {

  private final String errorCode;

  private final List<String> details;

  /** Construtor padrão com mensagem. */
  public ForbiddenException(String message) {

    super(message);

    this.errorCode = ErrorCodes.FORBIDDEN;

    this.details = null;
  }

  /** Construtor com código personalizado. */
  public ForbiddenException(String errorCode, String message) {

    super(message);

    this.errorCode = errorCode;

    this.details = null;
  }

  /** Construtor com código e detalhes adicionais. */
  public ForbiddenException(String errorCode, String message, List<String> details) {

    super(message);

    this.errorCode = errorCode;

    this.details = details;
  }

  /** Retorna o código do erro. */
  public String getErrorCode() {

    return errorCode;
  }

  /** Retorna detalhes adicionais. */
  public List<String> getDetails() {

    return details;
  }
}