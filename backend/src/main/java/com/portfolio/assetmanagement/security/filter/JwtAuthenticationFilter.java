package com.portfolio.assetmanagement.security.filter;

import com.portfolio.assetmanagement.domain.user.entity.User;
import com.portfolio.assetmanagement.infrastructure.persistence.user.repository.UserRepository;
import com.portfolio.assetmanagement.security.context.TenantContextHolder;
import com.portfolio.assetmanagement.security.service.TokenService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Optional;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * B3: TenantContextHolder.setTenant() nunca era chamado — o holder era declarado mas sempre vazio.
 * O filtro agora o popula com o organizationId do usuário autenticado.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

  private final TokenService tokenService;
  private final UserRepository userRepository;

  public JwtAuthenticationFilter(TokenService tokenService, UserRepository userRepository) {
    this.tokenService = tokenService;
    this.userRepository = userRepository;
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {

    try {
      final String authorizationHeader = request.getHeader("Authorization");

      if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
        filterChain.doFilter(request, response);
        return;
      }

      final String token = authorizationHeader.substring(7);

      if (!tokenService.isTokenValid(token)) {
        filterChain.doFilter(request, response);
        return;
      }

      UserDetails userDetails = tokenService.getUserDetails(token);

      UsernamePasswordAuthenticationToken authentication =
          new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
      authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
      SecurityContextHolder.getContext().setAuthentication(authentication);

      // B3: popula o TenantContextHolder com o organizationId do usuário autenticado
      Optional<User> user = userRepository.findByEmail(userDetails.getUsername());
      user.filter(u -> u.getOrganization() != null)
          .ifPresent(u -> TenantContextHolder.setTenant(u.getOrganization().getId()));

      filterChain.doFilter(request, response);

    } finally {
      TenantContextHolder.clear();
    }
  }
}
