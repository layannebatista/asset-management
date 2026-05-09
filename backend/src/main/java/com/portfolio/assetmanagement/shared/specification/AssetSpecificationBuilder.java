package com.portfolio.assetmanagement.shared.specification;

import com.portfolio.assetmanagement.domain.asset.entity.Asset;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.Collections;
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

  public AssetSpecification build() {
    return new AssetSpecification(
        Collections.unmodifiableList(new ArrayList<>(criteriaList)), search);
  }

  public static class AssetSpecification implements Specification<Asset> {

    private final List<FilterCriteria> criteriaList;
    private final String search;

    AssetSpecification(List<FilterCriteria> criteriaList, String search) {
      this.criteriaList = criteriaList;
      this.search = search;
    }

    public List<FilterCriteria> getCriteriaList() {
      return criteriaList;
    }

    @Override
    public Predicate toPredicate(
        jakarta.persistence.criteria.Root<Asset> root,
        jakarta.persistence.criteria.CriteriaQuery<?> query,
        jakarta.persistence.criteria.CriteriaBuilder cb) {

      // evita duplicação de resultados em joins
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
            predicates.add(
                cb.equal(root.join("unit", JoinType.LEFT).get("id"), criteria.getValue()));
            break;

          case "assignedUserId":
            predicates.add(
                cb.equal(root.join("assignedUser", JoinType.LEFT).get("id"), criteria.getValue()));
            break;

          case "organizationId":
            predicates.add(
                cb.equal(root.join("organization", JoinType.INNER).get("id"), criteria.getValue()));
            break;

          default:
            break;
        }
      }

      if (search != null) {
        String pattern = "%" + search + "%";
        Predicate searchPredicate =
            cb.or(
                cb.like(cb.lower(root.get("assetTag")), pattern),
                cb.like(cb.lower(root.get("model")), pattern));
        predicates.add(searchPredicate);
      }

      return cb.and(predicates.toArray(new Predicate[0]));
    }
  }
}
