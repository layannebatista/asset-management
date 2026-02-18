package com.portfolio.assetmanagement.shared.exception;

import com.portfolio.assetmanagement.shared.constants.ErrorCodes;
import java.util.List;

/**
 * Exceção para violações de regras de negócio.
 *
 * <p>Deve ser usada quando: - uma operação é inválida dentro da lógica do sistema - uma regra de
 * negócio é violada - uma ação não é permitida pelo estado atual
 *
 * <p>Exemplos: - atribuir ativo aposentado - transferir ativo bloqueado - criar entidade com dados
 * inconsistentes
 */
public class BusinessException extends RuntimeException {

  private final String errorCode;

  private final List<String> details;

  /** Construtor padrão com mensagem. */
  public BusinessException(String message) {

    super(message);

    this.errorCode = ErrorCodes.BUSINESS_RULE_VIOLATION;

    this.details = null;
  }

  /** Construtor com código personalizado e mensagem. */
  public BusinessException(String errorCode, String message) {

    super(message);

    this.errorCode = errorCode;

    this.details = null;
  }

  /** Construtor com código, mensagem e detalhes. */
  public BusinessException(String errorCode, String message, List<String> details) {

    super(message);

    this.errorCode = errorCode;

    this.details = details;
  }

  /** Retorna o código do erro. */
  public String getErrorCode() {

    return errorCode;
  }

  /** Retorna detalhes adicionais do erro. */
  public List<String> getDetails() {

    return details;
  }
}
