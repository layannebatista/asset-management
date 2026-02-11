package com.portfolio.asset_management.user.repository;

import com.portfolio.asset_management.user.entity.UserConsent;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserConsentRepository extends JpaRepository<UserConsent, Long> {

  Optional<UserConsent> findByUserId(Long userId);
}
