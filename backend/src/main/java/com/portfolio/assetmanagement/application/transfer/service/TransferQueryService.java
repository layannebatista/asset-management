package com.portfolio.assetmanagement.application.transfer.service;

import com.portfolio.assetmanagement.domain.transfer.entity.TransferRequest;
import com.portfolio.assetmanagement.domain.transfer.enums.TransferStatus;
import com.portfolio.assetmanagement.infrastructure.persistence.transfer.repository.TransferRepository;
import com.portfolio.assetmanagement.security.context.LoggedUserContext;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TransferQueryService {

  private final TransferRepository repository;
  private final LoggedUserContext loggedUser;

  public TransferQueryService(TransferRepository repository, LoggedUserContext loggedUser) {
    this.repository = repository;
    this.loggedUser = loggedUser;
  }

  @Transactional(readOnly = true)
  public Page<TransferRequest> list(
      TransferStatus status,
      Long assetId,
      LocalDate startDate,
      LocalDate endDate,
      Pageable pageable) {

    Specification<TransferRequest> spec = Specification.where(null);

    // GESTOR: vê apenas transfers da sua unidade (origem OU destino)
    if (loggedUser.isManager()) {
      Long unitId = loggedUser.getUnitId();
      if (unitId != null) {
        spec =
            spec.and(
                (root, q, cb) ->
                    cb.or(
                        cb.equal(root.join("fromUnit").get("id"), unitId),
                        cb.equal(root.join("toUnit").get("id"), unitId)));
      }
    }

    if (status != null) {
      spec = spec.and((root, q, cb) -> cb.equal(root.get("status"), status));
    }

    if (assetId != null) {
      spec = spec.and((root, q, cb) -> cb.equal(root.join("asset").get("id"), assetId));
    }

    if (startDate != null) {
      OffsetDateTime start = startDate.atStartOfDay().atOffset(ZoneOffset.UTC);
      spec = spec.and((root, q, cb) -> cb.greaterThanOrEqualTo(root.get("requestedAt"), start));
    }

    if (endDate != null) {
      OffsetDateTime end = endDate.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC);
      spec = spec.and((root, q, cb) -> cb.lessThan(root.get("requestedAt"), end));
    }

    return repository.findAll(spec, pageable);
  }
}
