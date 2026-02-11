package com.portfolio.asset_management.asset.service;

import com.portfolio.asset_management.asset.entity.Asset;
import com.portfolio.asset_management.asset.entity.AssetStatusHistory;
import com.portfolio.asset_management.asset.enums.AssetStatus;
import com.portfolio.asset_management.asset.repository.AssetStatusHistoryRepository;
import com.portfolio.asset_management.security.context.LoggedUserContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AssetStatusHistoryService {

  private final AssetStatusHistoryRepository repository;
  private final LoggedUserContext loggedUserContext;

  public AssetStatusHistoryService(
      AssetStatusHistoryRepository repository, LoggedUserContext loggedUserContext) {

    this.repository = repository;
    this.loggedUserContext = loggedUserContext;
  }

  @Transactional
  public void registerStatusChange(Asset asset, AssetStatus previousStatus, AssetStatus newStatus) {

    Long userId = loggedUserContext.getUserId();

    AssetStatusHistory history =
        new AssetStatusHistory(asset.getId(), previousStatus, newStatus, userId);

    repository.save(history);
  }
}
