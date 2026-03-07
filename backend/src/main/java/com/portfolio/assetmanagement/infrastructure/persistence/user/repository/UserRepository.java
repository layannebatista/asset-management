package com.portfolio.assetmanagement.infrastructure.persistence.user.repository;

import com.portfolio.assetmanagement.domain.organization.entity.Organization;
import com.portfolio.assetmanagement.domain.unit.entity.Unit;
import com.portfolio.assetmanagement.domain.user.entity.User;
import com.portfolio.assetmanagement.domain.user.enums.UserStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {

  Optional<User> findByEmail(String email);

  boolean existsByEmail(String email);

  List<User> findByOrganization(Organization organization);

  List<User> findByUnit(Unit unit);

  Optional<User> findByEmailAndOrganization(String email, Organization organization);

  boolean existsByIdAndOrganization(Long userId, Organization organization);

  Optional<User> findByIdAndOrganization(Long userId, Organization organization);

  List<User> findByOrganizationAndStatus(Organization organization, UserStatus status);

  boolean existsByEmailAndStatus(String email, UserStatus status);

  Optional<User> findByEmailAndStatus(String email, UserStatus status);
}
