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

    return dto;
  }
}
