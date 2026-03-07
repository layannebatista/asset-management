package com.portfolio.assetmanagement.application.user.service;

import com.portfolio.assetmanagement.domain.user.entity.User;
import com.portfolio.assetmanagement.domain.user.enums.UserStatus;
import com.portfolio.assetmanagement.infrastructure.persistence.user.repository.UserRepository;
import com.portfolio.assetmanagement.security.context.LoggedUserContext;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserQueryService {

  private final UserRepository repository;
  private final LoggedUserContext loggedUser;

  public UserQueryService(UserRepository repository, LoggedUserContext loggedUser) {
    this.repository = repository;
    this.loggedUser = loggedUser;
  }

  @Transactional(readOnly = true)
  public Page<User> list(
      UserStatus status, Long unitId, boolean includeInactive, Pageable pageable) {
    Long orgId = loggedUser.getOrganizationId();

    Specification<User> spec =
        (root, q, cb) -> cb.equal(root.join("organization").get("id"), orgId);

    if (!includeInactive) {
      spec = spec.and((root, q, cb) -> cb.notEqual(root.get("status"), UserStatus.INACTIVE));
    }

    if (status != null) {
      spec = spec.and((root, q, cb) -> cb.equal(root.get("status"), status));
    }

    if (unitId != null) {
      spec = spec.and((root, q, cb) -> cb.equal(root.join("unit").get("id"), unitId));
    }

    return repository.findAll(spec, pageable);
  }
}
