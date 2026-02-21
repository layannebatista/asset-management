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

    /* =======================
    ===== CARDS ===========
    ======================= */

    dto.setTotalAssets(data.getTotalAssets());
    dto.setTotalMaintenance(data.getTotalMaintenance());
    dto.setTotalUsers(data.getTotalUsers());

    /* =======================
    ===== ASSETS ==========
    ======================= */

    dto.setAssetsByStatus(convertToMap(data.getAssetsByStatus()));
    dto.setAssetsByUnit(convertToMap(data.getAssetsByUnit()));
    dto.setAssetsByType(convertToMap(data.getAssetsByType()));

    /* ==========================
    ===== MAINTENANCE ========
    ========================== */

    dto.setMaintenanceByStatus(convertToMap(data.getMaintenanceByStatus()));
    dto.setMaintenanceByMonth(convertMonthData(data.getMaintenanceByMonth()));

    /* ==========================
    ===== TRANSFER ===========
    ========================== */

    dto.setTransferByStatus(convertToMap(data.getTransferByStatus()));
    dto.setTransferByMonth(convertMonthData(data.getTransferByMonth()));

    /* ==========================
    ===== USERS ==============
    ========================== */

    dto.setUsersByStatus(convertToMap(data.getUsersByStatus()));
    dto.setUsersByRole(convertToMap(data.getUsersByRole()));

    return dto;
  }

  /* ===================================================== */

  private Map<String, Long> convertToMap(List<Object[]> rawData) {

    Map<String, Long> result = new HashMap<>();

    if (rawData == null) {
      return result;
    }

    for (Object[] row : rawData) {

      String key = String.valueOf(row[0]);
      Long value = ((Number) row[1]).longValue();

      result.put(key, value);
    }

    return result;
  }

  private Map<String, Long> convertMonthData(List<Object[]> rawData) {

    Map<String, Long> result = new HashMap<>();

    if (rawData == null) {
      return result;
    }

    for (Object[] row : rawData) {

      int year = ((Number) row[0]).intValue();
      int month = ((Number) row[1]).intValue();
      Long count = ((Number) row[2]).longValue();

      String key = year + "-" + String.format("%02d", month);

      result.put(key, count);
    }

    return result;
  }
}
