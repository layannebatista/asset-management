package com.portfolio.asset_management.organization.mapper;

import com.portfolio.asset_management.organization.dto.OrganizationResponseDTO;
import com.portfolio.asset_management.organization.entity.Organization;
import org.springframework.stereotype.Component;

/**
 * Mapper responsável pela conversão entre Organization e DTOs.
 *
 * <p>Centraliza a transformação e evita vazamento da entidade.
 */
@Component
public class OrganizationMapper {

  public OrganizationResponseDTO toResponseDTO(Organization organization) {

    if (organization == null) {
      return null;
    }

    return new OrganizationResponseDTO(
        organization.getId(), organization.getName(), organization.getStatus());
  }
}
