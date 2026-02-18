package com.portfolio.assetmanagement.application.asset.service;

import com.portfolio.assetmanagement.domain.asset.entity.Asset;
import com.portfolio.assetmanagement.domain.asset.entity.AssetAssignmentHistory;
import com.portfolio.assetmanagement.infrastructure.persistence.asset.repository.AssetAssignmentHistoryRepository;
import com.portfolio.assetmanagement.security.context.LoggedUserContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AssetAssignmentHistoryService {

  private final AssetAssignmentHistoryRepository repository;
  private final LoggedUserContext loggedUser;

  public AssetAssignmentHistoryService(
      AssetAssignmentHistoryRepository repository, LoggedUserContext loggedUser) {

    this.repository = repository;
    this.loggedUser = loggedUser;
  }

  @Transactional
  public void registerAssignmentChange(Asset asset, Long fromUserId, Long toUserId) {

    AssetAssignmentHistory history =
        new AssetAssignmentHistory(asset.getId(), fromUserId, toUserId, loggedUser.getUserId());

    repository.save(history);
  }
}
