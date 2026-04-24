package com.portfolio.assetmanagement.application.asset.service;

import com.portfolio.assetmanagement.domain.asset.entity.Asset;
import com.portfolio.assetmanagement.domain.asset.enums.AssetStatus;
import com.portfolio.assetmanagement.domain.unit.entity.Unit;
import com.portfolio.assetmanagement.domain.user.entity.User;
import com.portfolio.assetmanagement.shared.exception.BusinessException;
import org.springframework.stereotype.Service;

@Service
public class AssetStatusService {

  private final AssetStatusHistoryService historyService;

  public AssetStatusService(AssetStatusHistoryService historyService) {
    this.historyService = historyService;
  }

  public void assign(Asset asset, User user) {

    requireAsset(asset);

    if (asset.getStatus() == AssetStatus.RETIRED) {
      throw new BusinessException("Ativo aposentado não pode ser atribuído");
    }

    if (asset.getStatus() == AssetStatus.IN_MAINTENANCE) {
      throw new BusinessException("Ativo em manutenção não pode ser atribuído");
    }

    if (asset.getStatus() == AssetStatus.IN_TRANSFER) {
      throw new BusinessException("Ativo em transferência não pode ser atribuído");
    }

    if (asset.getAssignedUser() != null) {
      throw new BusinessException("Ativo já está atribuído");
    }

    AssetStatus previous = asset.getStatus();
    asset.assignToUser(user);
    historyService.registerStatusChange(asset, previous, AssetStatus.ASSIGNED);
  }

  public void unassign(Asset asset) {

    requireAsset(asset);

    if (asset.getAssignedUser() == null) {
      throw new BusinessException("Ativo não está atribuído");
    }

    AssetStatus previous = asset.getStatus();
    asset.unassignUser();
    historyService.registerStatusChange(asset, previous, AssetStatus.AVAILABLE);
  }

  public void transfer(Asset asset, Unit targetUnit) {

    requireAsset(asset);

    if (asset.getStatus() == AssetStatus.RETIRED) {
      throw new BusinessException("Ativo aposentado não pode ser transferido");
    }

    if (asset.getAssignedUser() != null) {
      asset.unassignUser();
    }

    AssetStatus previous = asset.getStatus();
    asset.completeTransfer(targetUnit);
    historyService.registerStatusChange(asset, previous, AssetStatus.AVAILABLE);
  }

  public void retire(Asset asset) {

    requireAsset(asset);

    if (asset.getStatus() == AssetStatus.RETIRED) {
      throw new BusinessException("Ativo já está aposentado");
    }

    AssetStatus previous = asset.getStatus();
    asset.retire();
    historyService.registerStatusChange(asset, previous, AssetStatus.RETIRED);
  }

  public void markAvailable(Asset asset) {

    requireAsset(asset);

    if (asset.getAssignedUser() != null) {
      AssetStatus previous = asset.getStatus();
      asset.unassignUser();
      historyService.registerStatusChange(asset, previous, AssetStatus.AVAILABLE);
    }
  }

  private void requireAsset(Asset asset) {
    if (asset == null) {
      throw new IllegalArgumentException("asset é obrigatório");
    }
  }
}
