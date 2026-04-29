package com.portfolio.assetmanagement.config.ratelimit;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Rate limiting por IP — implementação sem dependências externas.
 *
 * <p>Usa token bucket com janela deslizante via java.util.concurrent.
 *
 * <p>Limites por minuto:
 *
 * <ul>
 *   <li>/auth/login → 10 req/min
 *   <li>/auth/mfa/verify → 5 req/min
 *   <li>/auth/refresh → 30 req/min
 *   <li>demais → 200 req/min
 * </ul>
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

  private final boolean enabled;

  private static class Bucket {
    private final int capacity;
    private final long windowMillis;
    private final AtomicLong count = new AtomicLong(0);
    private volatile long windowStart = System.currentTimeMillis();

    Bucket(int capacity, Duration window) {
      this.capacity = capacity;
      this.windowMillis = window.toMillis();
    }

    synchronized boolean tryConsume() {
      long now = System.currentTimeMillis();
      if (now - windowStart >= windowMillis) {
        windowStart = now;
        count.set(0);
      }
      return count.incrementAndGet() <= capacity;
    }

    long remaining() {
      return Math.max(0, capacity - count.get());
    }
  }

  private final Map<String, Bucket> loginBuckets = new ConcurrentHashMap<>();
  private final Map<String, Bucket> mfaBuckets = new ConcurrentHashMap<>();
  private final Map<String, Bucket> refreshBuckets = new ConcurrentHashMap<>();
  private final Map<String, Bucket> globalBuckets = new ConcurrentHashMap<>();

  public RateLimitFilter(@Value("${app.rate-limit.enabled:true}") boolean enabled) {
    this.enabled = enabled;
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {

    if (!enabled) {
      filterChain.doFilter(request, response);
      return;
    }

    String ip = extractIp(request);
    String path = request.getRequestURI();

    Bucket bucket = resolveBucket(ip, path);
    response.setHeader("X-RateLimit-Remaining", String.valueOf(bucket.remaining()));

    if (!bucket.tryConsume()) {
      response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
      response.setContentType(MediaType.APPLICATION_JSON_VALUE);
      response.setHeader("Retry-After", "60");
      response
          .getWriter()
          .write(
              "{\"success\":false,\"error\":{\"code\":\"RATE_LIMIT_EXCEEDED\","
                  + "\"message\":\"Muitas requisições. Tente novamente em 60 segundos.\"}}");
      return;
    }

    filterChain.doFilter(request, response);
  }

  private Bucket resolveBucket(String ip, String path) {
    if (path.endsWith("/auth/login")) {
      return loginBuckets.computeIfAbsent(ip, k -> new Bucket(10, Duration.ofMinutes(1)));
    }
    if (path.endsWith("/auth/mfa/verify")) {
      return mfaBuckets.computeIfAbsent(ip, k -> new Bucket(5, Duration.ofMinutes(1)));
    }
    if (path.endsWith("/auth/refresh")) {
      return refreshBuckets.computeIfAbsent(ip, k -> new Bucket(30, Duration.ofMinutes(1)));
    }
    return globalBuckets.computeIfAbsent(ip, k -> new Bucket(200, Duration.ofMinutes(1)));
  }

  private String extractIp(HttpServletRequest request) {
    String forwarded = request.getHeader("X-Forwarded-For");
    if (forwarded != null && !forwarded.isBlank()) {
      return forwarded.split(",")[0].trim();
    }
    return request.getRemoteAddr();
  }

  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) {
    String path = request.getRequestURI();
    return path.startsWith("/v3/api-docs")
        || path.startsWith("/swagger-ui")
        || path.equals("/actuator/health");
  }

  /**
   * Utilizado pelos testes BDD para garantir isolamento entre cenários. Em produção, os buckets
   * devem persistir durante a janela de rate limit.
   */
  public void clearAllBucketsForTests() {
    loginBuckets.clear();
    mfaBuckets.clear();
    refreshBuckets.clear();
    globalBuckets.clear();
  }
}
