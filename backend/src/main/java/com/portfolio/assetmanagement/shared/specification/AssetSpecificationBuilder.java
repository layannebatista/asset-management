package com.portfolio.assetmanagement.shared.specification;

import com.portfolio.assetmanagement.domain.asset.entity.Asset;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.jpa.domain.Specification;

public class AssetSpecificationBuilder {

  private final List<FilterCriteria> criteriaList = new ArrayList<>();
  private String search;

  public AssetSpecificationBuilder with(String key, Object value) {
    if (value != null) {
      criteriaList.add(new FilterCriteria(key, value));
    }
    return this;
  }

  public AssetSpecificationBuilder withSearch(String search) {
    if (search != null && !search.isBlank()) {
      this.search = search.toLowerCase();
    }
    return this;
  }

  public Specification<Asset> build() {
    return (root, query, cb) -> {

      // 🔥 evita duplicação de resultados em joins
      query.distinct(true);

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
            // 🔥 LEFT JOIN seguro
            predicates.add(
                cb.equal(
                    root.join("unit", JoinType.LEFT).get("id"),
                    criteria.getValue()));
            break;

          case "assignedUserId":
            // 🔥 LEFT JOIN seguro (evita erro com null)
            predicates.add(
                cb.equal(
                    root.join("assignedUser", JoinType.LEFT).get("id"),
                    criteria.getValue()));
            break;

          case "organizationId":
            predicates.add(
                cb.equal(
                    root.join("organization", JoinType.INNER).get("id"),
                    criteria.getValue()));
            break;

          default:
            break;
        }
      }

      // 🔥 SEARCH (assetTag OR model)
      if (search != null) {
        String pattern = "%" + search + "%";

        Predicate searchPredicate =
            cb.or(
                cb.like(cb.lower(root.get("assetTag")), pattern),
                cb.like(cb.lower(root.get("model")), pattern));

        predicates.add(searchPredicate);
      }

      return cb.and(predicates.toArray(new Predicate[0]));
    };
  }
}