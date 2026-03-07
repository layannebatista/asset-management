package com.portfolio.assetmanagement.shared.specification;

import com.portfolio.assetmanagement.domain.asset.entity.Asset; // ← ADICIONADO
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.jpa.domain.Specification;

public class AssetSpecificationBuilder { // ← RENOMEADO (era SpecificationBuilder<T>)

  private final List<FilterCriteria> criteriaList = new ArrayList<>();

  public AssetSpecificationBuilder with(String key, Object value) { // ← ALTERADO tipo de retorno

    if (value != null) {
      criteriaList.add(new FilterCriteria(key, value));
    }
    return this;
  }

  public Specification<Asset> build() { // ← ALTERADO (era Specification<T>)

    return (root, query, cb) -> {
      List<Predicate> predicates = new ArrayList<>();

      for (FilterCriteria criteria : criteriaList) {

        switch (criteria.getKey()) {
          case "status":
          case "type":
            predicates.add(cb.equal(root.get(criteria.getKey()), criteria.getValue()));
            break;

          case "assetTag":
          case "model":
            predicates.add(
                cb.like(
                    cb.lower(root.get(criteria.getKey())),
                    "%" + criteria.getValue().toString().toLowerCase() + "%"));
            break;

          case "unitId":
            predicates.add(cb.equal(root.get("unit").get("id"), criteria.getValue()));
            break;

          case "assignedUserId":
            predicates.add(cb.equal(root.get("assignedUser").get("id"), criteria.getValue()));
            break;

          case "organizationId":
            predicates.add(cb.equal(root.get("organization").get("id"), criteria.getValue()));
            break;

          default:
            break;
        }
      }

      return cb.and(predicates.toArray(new Predicate[0]));
    };
  }
}
