package com.portfolio.assetmanagement.application.asset.service;

import com.portfolio.assetmanagement.domain.asset.entity.Asset;
import com.portfolio.assetmanagement.domain.asset.entity.AssetStatusHistory;
import com.portfolio.assetmanagement.domain.asset.enums.AssetStatus;
import com.portfolio.assetmanagement.infrastructure.persistence.asset.repository.AssetStatusHistoryRepository;
import com.portfolio.assetmanagement.security.context.LoggedUserContext;
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
