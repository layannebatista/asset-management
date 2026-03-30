package com.portfolio.assetmanagement.application.dashboard.service;

import com.portfolio.assetmanagement.application.dashboard.dto.DashboardData;
import com.portfolio.assetmanagement.application.dashboard.dto.PersonalDashboardDTO;
import org.springframework.stereotype.Component;

@Component
public class PersonalDashboardAssembler {

  public PersonalDashboardDTO assemble(DashboardData data) {
    PersonalDashboardDTO dto = new PersonalDashboardDTO();

    dto.setTotalAssetsAssigned(data.getTotalAssets());
    dto.setTotalMaintenanceRelated(data.getTotalMaintenance());

    // Novos campos operacionais
    dto.setMyPendingTransfers(data.getMyPendingTransfers());
    dto.setMyAssets(data.getMyAssets());
    dto.setMyOpenMaintenances(data.getMyOpenMaintenances());

    return dto;
  }
}
