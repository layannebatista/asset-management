package com.portfolio.asset_management.domain.shared;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.Version;

@MappedSuperclass
public abstract class VersionedEntity {

  @Version
  @Column(name = "version")
  private Long version;

  public Long getVersion() {
    return version;
  }
}
