package com.portfolio.assetmanagement.application.dashboard.service;

import com.portfolio.assetmanagement.application.dashboard.dto.DashboardData;
import com.portfolio.assetmanagement.application.dashboard.dto.ExecutiveDashboardDTO;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class ExecutiveDashboardAssembler {

  public ExecutiveDashboardDTO assemble(DashboardData data) {
    ExecutiveDashboardDTO dto = new ExecutiveDashboardDTO();

    dto.setTotalAssets(data.getTotalAssets());
    dto.setTotalMaintenance(data.getTotalMaintenance());
    dto.setTotalUsers(data.getTotalUsers());

    dto.setAssetsByStatus(convertToMap(data.getAssetsByStatus()));
    dto.setAssetsByUnit(convertToMap(data.getAssetsByUnit()));
    dto.setAssetsByType(convertToMap(data.getAssetsByType()));

    dto.setMaintenanceByStatus(convertToMap(data.getMaintenanceByStatus()));
    dto.setMaintenanceByMonth(convertMonthData(data.getMaintenanceByMonth()));

    dto.setTransferByStatus(convertToMap(data.getTransferByStatus()));
    dto.setTransferByMonth(convertMonthData(data.getTransferByMonth()));

    dto.setUsersByStatus(convertToMap(data.getUsersByStatus()));
    dto.setUsersByRole(convertToMap(data.getUsersByRole()));

    // Novos campos operacionais
    dto.setAssetsAvailable(data.getAssetsAvailable());
    dto.setAssetsRetiredThisMonth(data.getAssetsRetiredThisMonth());
    dto.setAssetsIdleCount(data.getAssetsIdleCount());
    dto.setPendingTransfersCount(data.getPendingTransfersCount());
    dto.setMaintenanceCostMonth(data.getMaintenanceCostMonth());
    dto.setInsuranceExpiringCount(data.getInsuranceExpiringCount());

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

  private Map<String, Long> convertMonthData(List<Object[]> rawData) {
    Map<String, Long> result = new HashMap<>();
    if (rawData == null) return result;
    for (Object[] row : rawData) {
      int year = ((Number) row[0]).intValue();
      int month = ((Number) row[1]).intValue();
      result.put(year + "-" + String.format("%02d", month), ((Number) row[2]).longValue());
    }
    return result;
  }
}
