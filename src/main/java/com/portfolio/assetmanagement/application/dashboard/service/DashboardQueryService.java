package com.portfolio.assetmanagement.application.dashboard.service;

import com.portfolio.assetmanagement.application.dashboard.dto.DashboardData;
import com.portfolio.assetmanagement.infrastructure.persistence.dashboard.repository.DashboardQueryRepository;
import com.portfolio.assetmanagement.security.context.LoggedUserContext;
import org.springframework.stereotype.Service;

@Service
public class DashboardQueryService {

  private final DashboardQueryRepository repository;
  private final LoggedUserContext loggedUserContext;

  public DashboardQueryService(
      DashboardQueryRepository repository, LoggedUserContext loggedUserContext) {

    this.repository = repository;
    this.loggedUserContext = loggedUserContext;
  }

  public DashboardData loadDashboardData() {

    if (loggedUserContext.isAdmin()) {
      return loadAdmin();
    }

    if (loggedUserContext.isManager()) {
      return loadManager();
    }

    return loadOperator();
  }

  private DashboardData loadAdmin() {

    Long orgId = loggedUserContext.getOrganizationId();

    DashboardData data = new DashboardData();

    data.setTotalAssets(repository.countAssetsByOrganization(orgId));
    data.setAssetsByStatus(repository.countAssetsByStatus(orgId));
    data.setAssetsByUnit(repository.countAssetsByUnit(orgId));
    data.setAssetsByType(repository.countAssetsByType(orgId));

    data.setTotalMaintenance(repository.countMaintenanceByOrganization(orgId));
    data.setMaintenanceByStatus(repository.countMaintenanceByStatus(orgId));

    data.setTransferByStatus(repository.countTransferByStatus(orgId));

    data.setTotalUsers(repository.countUsersByUnit(orgId));
    data.setUsersByStatus(repository.countUsersByStatus(orgId));

    return data;
  }

  private DashboardData loadManager() {

    Long unitId = loggedUserContext.getUnitId();

    DashboardData data = new DashboardData();

    data.setTotalAssets(repository.countAssetsByUnitScope(unitId));
    data.setAssetsByStatus(repository.countAssetsByStatusUnit(unitId));

    data.setTotalMaintenance(repository.countMaintenanceByUnit(unitId));
    data.setMaintenanceByStatus(repository.countMaintenanceByStatusUnit(unitId));

    data.setTotalUsers(repository.countUsersByUnit(unitId));

    return data;
  }

  private DashboardData loadOperator() {

    Long userId = loggedUserContext.getUserId();

    DashboardData data = new DashboardData();

    data.setTotalAssets(repository.countAssetsByUser(userId));
    data.setTotalMaintenance(repository.countMaintenanceByUser(userId));

    return data;
  }
}
