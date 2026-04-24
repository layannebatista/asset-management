package com.portfolio.assetmanagement.config.ratelimit;

import static org.assertj.core.api.Assertions.assertThat;

import jakarta.servlet.ServletException;
import java.io.IOException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

@DisplayName("RateLimitFilter")
@Tag("testType=Config")
@Tag("module=Ratelimit")
class RateLimitFilterTest {

  @Test
  @DisplayName("U07 - limita login por IP após 10 tentativas")
  void limitaLoginPorIpAposDezTentativas() throws ServletException, IOException {
    RateLimitFilter filter = new RateLimitFilter();
    MockHttpServletResponse response = new MockHttpServletResponse();

    for (int attempt = 0; attempt < 11; attempt++) {
      MockHttpServletRequest request = new MockHttpServletRequest("POST", "/auth/login");
      request.addHeader("X-Forwarded-For", "172.16.0.10");
      response = new MockHttpServletResponse();
      filter.doFilter(request, response, new MockFilterChain());
    }

    assertThat(response.getStatus()).isEqualTo(429);
    assertThat(response.getHeader("Retry-After")).isEqualTo("60");
  }
}
