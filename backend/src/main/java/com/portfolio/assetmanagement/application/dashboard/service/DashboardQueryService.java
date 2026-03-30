package com.portfolio.assetmanagement.application.dashboard.service;

import com.portfolio.assetmanagement.application.dashboard.dto.DashboardData;
import com.portfolio.assetmanagement.infrastructure.persistence.dashboard.repository.DashboardQueryRepository;
import com.portfolio.assetmanagement.security.context.LoggedUserContext;
import com.portfolio.assetmanagement.shared.exception.BusinessException;
import java.util.List;
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
    if (loggedUserContext.isAdmin()) return loadAdmin();
    if (loggedUserContext.isManager()) return loadManager();
    return loadOperator();
  }

  private DashboardData loadAdmin() {
    Long orgId = loggedUserContext.getOrganizationId();
    DashboardData data = new DashboardData();

    // Campos existentes
    data.setTotalAssets(repository.countAssetsByOrganization(orgId));
    data.setAssetsByStatus(repository.countAssetsByStatus(orgId));
    data.setAssetsByUnit(repository.countAssetsByUnit(orgId));
    data.setAssetsByType(repository.countAssetsByType(orgId));
    data.setTotalMaintenance(repository.countMaintenanceByOrganization(orgId));
    data.setMaintenanceByStatus(repository.countMaintenanceByStatus(orgId));
    data.setMaintenanceByMonth(repository.countMaintenanceByMonth(orgId));
    data.setTransferByStatus(repository.countTransferByStatus(orgId));
    data.setTransferByMonth(repository.countTransferByMonth(orgId));
    data.setTotalUsers(repository.countUsersByOrganization(orgId));
    data.setUsersByStatus(repository.countUsersByStatus(orgId));
    data.setUsersByRole(repository.countUsersByRole(orgId));

    // Novos campos operacionais
    data.setAssetsAvailable(repository.countAssetsAvailableByOrg(orgId));
    data.setAssetsRetiredThisMonth(repository.countAssetsRetiredThisMonth(orgId));
    data.setAssetsIdleCount(repository.countAssetsIdleByOrg(orgId));
    data.setPendingTransfersCount(repository.countPendingTransfersByOrg(orgId));
    data.setMaintenanceCostMonth(repository.sumMaintenanceCostThisMonth(orgId));
    data.setInsuranceExpiringCount(repository.countInsuranceExpiringSoon(orgId));

    return data;
  }

  private DashboardData loadManager() {
    Long unitId = loggedUserContext.getUnitId();
    if (unitId == null)
      throw new BusinessException("Usuário não possui unidade associada. Contate o administrador.");

    DashboardData data = new DashboardData();

    // Campos existentes
    data.setTotalAssets(repository.countAssetsByUnitScope(unitId));
    data.setAssetsByStatus(repository.countAssetsByStatusUnit(unitId));
    data.setTotalMaintenance(repository.countMaintenanceByUnit(unitId));
    data.setMaintenanceByStatus(repository.countMaintenanceByStatusUnit(unitId));
    data.setTotalUsers(repository.countUsersByUnit(unitId));

    // Novos campos operacionais
    Long available = repository.countAssetsAvailableByUnit(unitId);
    Long total = data.getTotalAssets() != null ? data.getTotalAssets() : 0L;

    // Calcula utilizationRate: ASSIGNED / (total - RETIRED) * 100
    Long assignedCount = repository.countAssetsByStatusAndUnit(unitId, "ASSIGNED");
    Long retiredCount  = repository.countAssetsByStatusAndUnit(unitId, "RETIRED");
    long activeTotal = total - retiredCount;
    double rate = activeTotal > 0 ? Math.round((assignedCount * 100.0 / activeTotal) * 10.0) / 10.0 : 0.0;

    data.setAssetsAvailable(available);
    data.setUtilizationRate(rate);
    data.setPendingTransfersCount(repository.countPendingTransfersByUnit(unitId));
    data.setMaintenanceCostMonth(repository.sumMaintenanceCostThisMonthByUnit(unitId));
    data.setAssetsIdleList(repository.findIdleAssetsByUnit(unitId));

    return data;
  }

  private DashboardData loadOperator() {
    Long userId = loggedUserContext.getUserId();
    DashboardData data = new DashboardData();

    data.setTotalAssets(repository.countAssetsByUser(userId));
    data.setTotalMaintenance(repository.countMaintenanceByUser(userId));

    // Novos campos operacionais
    data.setMyPendingTransfers(repository.countPendingTransfersByUser(userId));
    data.setMyAssets(repository.findAssetsByUser(userId));
    data.setMyOpenMaintenances(repository.findOpenMaintenancesByUser(userId));

    return data;
  }
}
