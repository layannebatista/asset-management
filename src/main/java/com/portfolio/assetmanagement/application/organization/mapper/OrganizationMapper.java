package com.portfolio.assetmanagement.application.organization.mapper;

import com.portfolio.assetmanagement.application.organization.dto.OrganizationResponseDTO;
import com.portfolio.assetmanagement.domain.organization.entity.Organization;
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
