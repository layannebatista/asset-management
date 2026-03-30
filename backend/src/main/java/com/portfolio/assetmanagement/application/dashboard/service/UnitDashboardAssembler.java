package com.portfolio.assetmanagement.application.dashboard.service;

import com.portfolio.assetmanagement.application.dashboard.dto.AssetIdleItemDTO;
import com.portfolio.assetmanagement.application.dashboard.dto.DashboardData;
import com.portfolio.assetmanagement.application.dashboard.dto.UnitDashboardDTO;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class UnitDashboardAssembler {

  public UnitDashboardDTO assemble(DashboardData data) {
    UnitDashboardDTO dto = new UnitDashboardDTO();

    dto.setTotalAssets(data.getTotalAssets());
    dto.setTotalMaintenance(data.getTotalMaintenance());
    dto.setTotalUsers(data.getTotalUsers());
    dto.setAssetsByStatus(convertToMap(data.getAssetsByStatus()));
    dto.setMaintenanceByStatus(convertToMap(data.getMaintenanceByStatus()));

    // Novos campos operacionais
    dto.setAssetsAvailable(data.getAssetsAvailable());
    dto.setUtilizationRate(data.getUtilizationRate());
    dto.setPendingTransfersCount(data.getPendingTransfersCount());
    dto.setMaintenanceCostMonth(data.getMaintenanceCostMonth());
    dto.setAssetsIdleList(data.getAssetsIdleList());

    return dto;
  }

  private Map<String, Long> convertToMap(List<Object[]> rawData) {
    Map<String, Long> result = new HashMap<>();
    if (rawData == null) return result;
    for (Object[] row : rawData) {
      result.put(String.valueOf(row[0]), ((Number) row[1]).longValue());
    }
    return result;
  }
}
