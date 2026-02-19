package com.portfolio.assetmanagement.shared.specification;

public class FilterCriteria {

  private final String key;
  private final Object value;

  public FilterCriteria(String key, Object value) {
    this.key = key;
    this.value = value;
  }

  public String getKey() {
    return key;
  }

  public Object getValue() {
    return value;
  }
}
