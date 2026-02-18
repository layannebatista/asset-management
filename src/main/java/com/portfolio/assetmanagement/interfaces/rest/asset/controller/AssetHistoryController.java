package com.portfolio.assetmanagement.interfaces.rest.asset.controller;

import com.portfolio.assetmanagement.domain.asset.entity.AssetAssignmentHistory;
import com.portfolio.assetmanagement.domain.asset.entity.AssetStatusHistory;
import com.portfolio.assetmanagement.infrastructure.persistence.asset.repository.AssetAssignmentHistoryRepository;
import com.portfolio.assetmanagement.infrastructure.persistence.asset.repository.AssetStatusHistoryRepository;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/assets/{assetId}/history")
public class AssetHistoryController {

  private final AssetStatusHistoryRepository statusRepository;
  private final AssetAssignmentHistoryRepository assignmentRepository;

  public AssetHistoryController(
      AssetStatusHistoryRepository statusRepository,
      AssetAssignmentHistoryRepository assignmentRepository) {

    this.statusRepository = statusRepository;
    this.assignmentRepository = assignmentRepository;
  }

  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @GetMapping("/status")
  public List<AssetStatusHistory> getStatusHistory(@PathVariable Long assetId) {

    return statusRepository.findByAssetIdOrderByChangedAtDesc(assetId);
  }

  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @GetMapping("/assignment")
  public List<AssetAssignmentHistory> getAssignmentHistory(@PathVariable Long assetId) {

    return assignmentRepository.findByAssetIdOrderByChangedAtDesc(assetId);
  }
}
