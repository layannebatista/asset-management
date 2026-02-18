package com.portfolio.assetmanagement.domain.user.enums;

/**
 * Define os possíveis estados de um usuário no sistema.
 *
 * <p>O status do usuário impacta diretamente o acesso às funcionalidades e a validade da
 * autenticação.
 */
public enum UserStatus {
  PENDING_ACTIVATION,
  ACTIVE,
  BLOCKED,
  INACTIVE
}