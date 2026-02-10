package com.portfolio.asset_management.inventory.repository;

import com.portfolio.asset_management.inventory.entity.InventorySession;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InventorySessionRepository extends JpaRepository<InventorySession, Long> {

  List<InventorySession> findByOrganization_Id(Long organizationId);

  List<InventorySession> findByUnit_Id(Long unitId);
}
