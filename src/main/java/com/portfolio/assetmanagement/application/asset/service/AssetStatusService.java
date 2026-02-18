package com.portfolio.assetmanagement.application.asset.service;

import com.portfolio.assetmanagement.domain.asset.entity.Asset;
import com.portfolio.assetmanagement.domain.asset.enums.AssetStatus;
import com.portfolio.assetmanagement.shared.exception.BusinessException;
import com.portfolio.assetmanagement.domain.unit.entity.Unit;
import com.portfolio.assetmanagement.domain.user.entity.User;
import org.springframework.stereotype.Service;

/** Serviço responsável por controlar transições de status do Asset. */
@Service
public class AssetStatusService {

  public void assign(Asset asset, User user) {

    requireAsset(asset);

    if (asset.getStatus() == AssetStatus.RETIRED) {

      throw new BusinessException("Ativo aposentado não pode ser atribuído");
    }

    if (asset.getAssignedUser() != null) {

      throw new BusinessException("Ativo já está atribuído");
    }

    asset.assignToUser(user);
  }

  public void unassign(Asset asset) {

    requireAsset(asset);

    if (asset.getAssignedUser() == null) {

      throw new BusinessException("Ativo não está atribuído");
    }

    asset.unassignUser();
  }

  /** Transferência de unidade. */
  public void transfer(Asset asset, Unit targetUnit) {

    requireAsset(asset);

    if (asset.getStatus() == AssetStatus.RETIRED) {

      throw new BusinessException("Ativo aposentado não pode ser transferido");
    }

    if (asset.getAssignedUser() != null) {

      asset.unassignUser();
    }

    asset.changeUnit(targetUnit);
  }

  public void retire(Asset asset) {

    requireAsset(asset);

    if (asset.getStatus() == AssetStatus.RETIRED) {

      throw new BusinessException("Ativo já está aposentado");
    }

    asset.retire();
  }

  /** Marca como disponível (via unassign seguro). */
  public void markAvailable(Asset asset) {

    requireAsset(asset);

    if (asset.getAssignedUser() != null) {

      asset.unassignUser();
    }
  }

  private void requireAsset(Asset asset) {

    if (asset == null) {

      throw new IllegalArgumentException("asset é obrigatório");
    }
  }
}