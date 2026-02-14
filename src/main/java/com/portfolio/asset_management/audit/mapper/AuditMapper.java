package com.portfolio.asset_management.audit.mapper;

import com.portfolio.asset_management.audit.dto.AuditEventResponseDTO;
import com.portfolio.asset_management.audit.entity.AuditEvent;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

/**
 * Mapper responsável por converter AuditEvent ↔ DTO.
 *
 * <p>Padrão enterprise: - evita expor entidade diretamente - desacopla controller da camada de
 * persistência
 */
@Component
public class AuditMapper {

  /** Converte entidade para DTO. */
  public AuditEventResponseDTO toDTO(AuditEvent entity) {

    if (entity == null) {
      return null;
    }

    return new AuditEventResponseDTO(entity);
  }

  /** Converte lista de entidades para DTO. */
  public List<AuditEventResponseDTO> toDTOList(List<AuditEvent> entities) {

    if (entities == null) {
      return List.of();
    }

    return entities.stream().map(this::toDTO).collect(Collectors.toList());
  }
}
