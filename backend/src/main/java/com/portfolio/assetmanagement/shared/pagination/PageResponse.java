package com.portfolio.assetmanagement.shared.pagination;

import java.util.List;
import org.springframework.data.domain.Page;

public class PageResponse<T> {

  private List<T> content;
  private int page;
  private int size;
  private long totalElements;
  private int totalPages;

  public PageResponse(List<T> content, int page, int size, long totalElements, int totalPages) {

    this.content = content;
    this.page = page;
    this.size = size;
    this.totalElements = totalElements;
    this.totalPages = totalPages;
  }

  public static <T, U> PageResponse<T> from(Page<U> page, List<T> content) {

    return new PageResponse<>(
        content, page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages());
  }

  public List<T> getContent() {
    return content;
  }

  public int getPage() {
    return page;
  }

  public int getSize() {
    return size;
  }

  public long getTotalElements() {
    return totalElements;
  }

  public int getTotalPages() {
    return totalPages;
  }
}
