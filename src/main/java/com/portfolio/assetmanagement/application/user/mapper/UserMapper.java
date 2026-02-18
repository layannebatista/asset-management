package com.portfolio.assetmanagement.application.user.mapper;

import com.portfolio.assetmanagement.application.user.dto.UserResponseDTO;
import com.portfolio.assetmanagement.domain.user.entity.User;
import org.springframework.stereotype.Component;

/**
 * Mapper responsável pela conversão entre User e DTOs.
 *
 * <p>Centraliza a transformação e evita vazamento de dados sensíveis.
 */
@Component
public class UserMapper {

  public UserResponseDTO toResponseDTO(User user) {

    if (user == null) {
      return null;
    }

    return new UserResponseDTO(
        user.getId(),
        user.getName(),
        user.getEmail(),
        user.getRole(),
        user.getStatus(),
        user.getOrganization().getId(),
        user.getUnit().getId(),
        user.isLgpdAccepted());
  }
}