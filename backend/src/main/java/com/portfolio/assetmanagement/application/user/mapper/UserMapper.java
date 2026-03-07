package com.portfolio.assetmanagement.application.user.mapper;

import com.portfolio.assetmanagement.application.user.dto.UserResponseDTO;
import com.portfolio.assetmanagement.domain.user.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

  public UserResponseDTO toResponseDTO(User user) {

    if (user == null) return null;

    // Nunca expõe o phoneNumber na resposta — apenas indica se MFA está habilitado
    boolean mfaEnabled = user.getPhoneNumber() != null && !user.getPhoneNumber().isBlank();

    return new UserResponseDTO(
        user.getId(),
        user.getName(),
        user.getEmail(),
        user.getRole(),
        user.getStatus(),
        user.getOrganization().getId(),
        user.getUnit().getId(),
        user.isLgpdAccepted(),
        mfaEnabled);
  }
}
