package com.portfolio.assetmanagement.security.controller;

import com.portfolio.assetmanagement.security.dto.LoginRequestDTO;
import com.portfolio.assetmanagement.security.dto.LoginResponseDTO;
import com.portfolio.assetmanagement.security.enums.UserRole;
import com.portfolio.assetmanagement.security.service.TokenService;
import jakarta.validation.Valid;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

  private final AuthenticationManager authenticationManager;

  private final TokenService tokenService;

  public AuthController(AuthenticationManager authenticationManager, TokenService tokenService) {

    this.authenticationManager = authenticationManager;

    this.tokenService = tokenService;
  }

  @PostMapping("/login")
  public LoginResponseDTO login(@RequestBody @Valid LoginRequestDTO request) {

    Authentication authentication =
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

    UserDetails userDetails = (UserDetails) authentication.getPrincipal();

    String token = tokenService.generateToken(userDetails);

    UserRole role =
        UserRole.valueOf(
            userDetails.getAuthorities().iterator().next().getAuthority().replace("ROLE_", ""));

    return new LoginResponseDTO(token, "Bearer", role);
  }
}