package com.portfolio.assetmanagement.shared.specification;

import jakarta.persistence.criteria.*;
import org.springframework.data.jpa.domain.Specification;

public abstract class BaseSpecification<T> implements Specification<T> {

  protected Predicate buildPredicate(Root<T> root, CriteriaBuilder cb, FilterCriteria criteria) {

    if (criteria.getValue() == null) {
      return null;
    }

    switch (criteria.getKey()) {
      case "status":
        return cb.equal(root.get("status"), criteria.getValue());

      case "type":
        return cb.equal(root.get("type"), criteria.getValue());

      case "assetTag":
        return cb.like(
            cb.lower(root.get("assetTag")),
            "%" + criteria.getValue().toString().toLowerCase() + "%");

      case "model":
        return cb.like(
            cb.lower(root.get("model")), "%" + criteria.getValue().toString().toLowerCase() + "%");

      case "unitId":
        return cb.equal(root.get("unit").get("id"), criteria.getValue());

      case "assignedUserId":
        return cb.equal(root.get("assignedUser").get("id"), criteria.getValue());

      case "organizationId":
        return cb.equal(root.get("organization").get("id"), criteria.getValue());

      default:
        return null;
    }
  }
}
