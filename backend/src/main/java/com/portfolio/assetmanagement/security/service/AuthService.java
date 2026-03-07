package com.portfolio.assetmanagement.security.service;

import com.portfolio.assetmanagement.application.mfa.service.MfaService;
import com.portfolio.assetmanagement.application.user.service.UserService;
import com.portfolio.assetmanagement.domain.auth.entity.RefreshToken;
import com.portfolio.assetmanagement.domain.user.entity.User;
import com.portfolio.assetmanagement.security.dto.LoginRequestDTO;
import com.portfolio.assetmanagement.security.dto.LoginResponseDTO;
import com.portfolio.assetmanagement.security.dto.MfaVerifyRequestDTO;
import com.portfolio.assetmanagement.security.dto.RefreshRequestDTO;
import com.portfolio.assetmanagement.security.enums.UserRole;
import java.util.List;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

  private final AuthenticationManager authenticationManager;
  private final TokenService tokenService;
  private final UserService userService;
  private final MfaService mfaService;
  private final RefreshTokenService refreshTokenService;

  public AuthService(
      AuthenticationManager authenticationManager,
      TokenService tokenService,
      UserService userService,
      MfaService mfaService,
      RefreshTokenService refreshTokenService) {

    this.authenticationManager = authenticationManager;
    this.tokenService = tokenService;
    this.userService = userService;
    this.mfaService = mfaService;
    this.refreshTokenService = refreshTokenService;
  }

  /** Autentica com email + senha. Inicia MFA se usuário tiver telefone. */
  public LoginResponseDTO authenticate(LoginRequestDTO request) {
    try {
      Authentication authentication =
          authenticationManager.authenticate(
              new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

      UserDetails userDetails = (UserDetails) authentication.getPrincipal();
      User user = userService.findByEmail(request.getEmail());

      if (user.getPhoneNumber() != null && !user.getPhoneNumber().isBlank()) {
        mfaService.generateAndSend(user.getId(), user.getPhoneNumber());
        return LoginResponseDTO.mfaChallenge(user.getId());
      }

      return issueFullResponse(userDetails, user.getId());

    } catch (BadCredentialsException ex) {
      throw new BadCredentialsException("Email ou senha inválidos");
    }
  }

  /** Verifica código MFA e emite JWT + refresh token. */
  public LoginResponseDTO verifyMfa(MfaVerifyRequestDTO request) {
    mfaService.validate(request.getUserId(), request.getCode());

    User user = userService.findById(request.getUserId());
    UserDetails userDetails = buildUserDetails(user);

    return issueFullResponse(userDetails, user.getId());
  }

  /**
   * Renova o access token usando um refresh token válido.
   *
   * <p>Rotação automática: o refresh token recebido é revogado e um novo é emitido junto com o novo
   * access token.
   */
  public LoginResponseDTO refresh(RefreshRequestDTO request) {
    RefreshToken old = refreshTokenService.validateAndRotate(request.getRefreshToken());

    User user = userService.findById(old.getUserId());
    UserDetails userDetails = buildUserDetails(user);

    String newAccessToken = tokenService.generateToken(userDetails);
    RefreshToken newRefresh = refreshTokenService.generate(user.getId());

    return LoginResponseDTO.refreshed(newAccessToken, newRefresh.getToken());
  }

  /** Logout: revoga todos os refresh tokens do usuário autenticado. */
  public void logout(Long userId) {
    refreshTokenService.revokeAll(userId);
  }

  // ─────────────────────────────────────────────
  //  Helpers
  // ─────────────────────────────────────────────

  private LoginResponseDTO issueFullResponse(UserDetails userDetails, Long userId) {
    String accessToken = tokenService.generateToken(userDetails);
    RefreshToken refreshToken = refreshTokenService.generate(userId);

    UserRole role =
        UserRole.valueOf(
            userDetails.getAuthorities().iterator().next().getAuthority().replace("ROLE_", ""));

    return new LoginResponseDTO(accessToken, refreshToken.getToken(), "Bearer", role);
  }

  private UserDetails buildUserDetails(User user) {
    return new org.springframework.security.core.userdetails.User(
        user.getEmail(),
        user.getPasswordHash() != null ? user.getPasswordHash() : "",
        List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())));
  }
}
