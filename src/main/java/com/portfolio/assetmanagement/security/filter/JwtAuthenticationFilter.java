package com.portfolio.assetmanagement.security.filter;

import com.portfolio.assetmanagement.security.service.TokenService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Filtro responsável por:
 *
 * <p>- Extrair o token JWT do header Authorization - Validar o token - Carregar o usuário -
 * Registrar o usuário no SecurityContext
 *
 * <p>Compatível com TokenService e LoggedUserContext.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

  private final TokenService tokenService;

  public JwtAuthenticationFilter(TokenService tokenService) {
    this.tokenService = tokenService;
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {

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

    filterChain.doFilter(request, response);
  }
}