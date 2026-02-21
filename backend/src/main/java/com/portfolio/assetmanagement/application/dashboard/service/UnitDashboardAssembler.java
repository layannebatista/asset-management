package com.portfolio.assetmanagement.application.dashboard.service;

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

    return dto;
  }

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
}
