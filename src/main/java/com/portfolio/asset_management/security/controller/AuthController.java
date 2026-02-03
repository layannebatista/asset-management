package com.portfolio.asset_management.security.controller;

import com.portfolio.asset_management.security.dto.LoginRequestDTO;
import com.portfolio.asset_management.security.dto.LoginResponseDTO;
import com.portfolio.asset_management.security.enums.UserRole;
import com.portfolio.asset_management.security.service.TokenService;
import jakarta.validation.Valid;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller responsável pelos endpoints de autenticação.
 *
 * <p>Realiza login via email/senha e retorna JWT. Não existe auto cadastro externo.
 */
@RestController
public class AuthController {

  private final AuthenticationManager authenticationManager;
  private final TokenService tokenService;

  public AuthController(AuthenticationManager authenticationManager, TokenService tokenService) {
    this.authenticationManager = authenticationManager;
    this.tokenService = tokenService;
  }

  @PostMapping("/auth/login")
  public LoginResponseDTO login(@Valid @RequestBody LoginRequestDTO request) {

    Authentication authentication =
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

    UserDetails userDetails = (UserDetails) authentication.getPrincipal();

    String token = tokenService.generateToken(userDetails);

    UserRole role =
        UserRole.valueOf(
            userDetails.getAuthorities().iterator().next().getAuthority().replace("ROLE_", ""));

    return new LoginResponseDTO(
        token, // accessToken
        "Bearer", // tokenType
        role // role
        );
  }
}
