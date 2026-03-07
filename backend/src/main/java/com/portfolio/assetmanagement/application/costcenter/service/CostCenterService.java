package com.portfolio.assetmanagement.application.costcenter.service;

import com.portfolio.assetmanagement.domain.costcenter.entity.CostCenter;
import com.portfolio.assetmanagement.infrastructure.persistence.costcenter.repository.CostCenterRepository;
import com.portfolio.assetmanagement.shared.exception.BusinessException;
import com.portfolio.assetmanagement.shared.exception.NotFoundException;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CostCenterService {

  private final CostCenterRepository repository;

  public CostCenterService(CostCenterRepository repository) {
    this.repository = repository;
  }

  public List<CostCenter> listActive(Long organizationId) {
    return repository.findByOrganizationIdAndActiveTrue(organizationId);
  }

  @Transactional
  public CostCenter create(Long orgId, Long unitId, String code, String name) {

    String normalizedCode = code.toUpperCase();

    if (repository.existsByOrganizationIdAndCode(orgId, normalizedCode)) {
      throw new BusinessException("Já existe um centro de custo com o código: " + code);
    }

    CostCenter cc = new CostCenter(orgId, unitId, normalizedCode, name);

    return repository.save(cc);
  }

  @Transactional
  public void deactivate(Long id) {

    CostCenter cc =
        repository
            .findById(id)
            .orElseThrow(() -> new NotFoundException("Centro de custo não encontrado"));

    cc.deactivate();

    repository.save(cc);
  }
}
