package com.portfolio.asset_management.security.authorization;

import java.io.Serializable;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component
public class PermissionEvaluator
    implements org.springframework.security.access.PermissionEvaluator {

  @Override
  public boolean hasPermission(
      Authentication authentication, Object targetDomainObject, Object permission) {

    if (authentication == null || permission == null) {
      return false;
    }

    return authentication.getAuthorities().stream()
        .anyMatch(a -> a.getAuthority().equals(permission.toString()));
  }

  @Override
  public boolean hasPermission(
      Authentication authentication, Serializable targetId, String targetType, Object permission) {

    if (authentication == null || permission == null) {
      return false;
    }

    return authentication.getAuthorities().stream()
        .anyMatch(a -> a.getAuthority().equals(permission.toString()));
  }
}
