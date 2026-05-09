package com.portfolio.assetmanagement.security.service;

import com.portfolio.assetmanagement.application.mfa.service.MfaService;
import com.portfolio.assetmanagement.domain.auth.entity.RefreshToken;
import com.portfolio.assetmanagement.domain.user.entity.User;
import com.portfolio.assetmanagement.domain.user.enums.UserStatus;
import com.portfolio.assetmanagement.infrastructure.persistence.user.repository.UserRepository;
import com.portfolio.assetmanagement.security.dto.LoginRequestDTO;
import com.portfolio.assetmanagement.security.dto.LoginResponseDTO;
import com.portfolio.assetmanagement.security.dto.MfaVerifyRequestDTO;
import com.portfolio.assetmanagement.security.dto.RefreshRequestDTO;
import com.portfolio.assetmanagement.security.enums.UserRole;
import com.portfolio.assetmanagement.shared.exception.BusinessException;
import com.portfolio.assetmanagement.shared.exception.NotFoundException;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

  private static final Logger log = LoggerFactory.getLogger(AuthService.class);

  private final AuthenticationManager authenticationManager;
  private final TokenService tokenService;
  private final UserRepository userRepository;
  private final MfaService mfaService;
  private final RefreshTokenService refreshTokenService;

  public AuthService(
      AuthenticationManager authenticationManager,
      TokenService tokenService,
      UserRepository userRepository,
      MfaService mfaService,
      RefreshTokenService refreshTokenService) {

    this.authenticationManager = authenticationManager;
    this.tokenService = tokenService;
    this.userRepository = userRepository;
    this.mfaService = mfaService;
    this.refreshTokenService = refreshTokenService;
  }

  public LoginResponseDTO authenticate(LoginRequestDTO request) {
    log.info("AUTH >> tentativa de login para: {}", request.getEmail());

    try {
      Authentication authentication =
          authenticationManager.authenticate(
              new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

      log.info("AUTH >> authenticationManager OK para: {}", request.getEmail());

      UserDetails userDetails = (UserDetails) authentication.getPrincipal();

      User user =
          userRepository
              .findByEmail(request.getEmail())
              .orElseThrow(
                  () -> new BadCredentialsException("Usuário não encontrado após autenticação"));

      log.info(
          "AUTH >> usuário encontrado: id={}, status={}, lgpd={}, hashPrefix={}",
          user.getId(),
          user.getStatus(),
          user.isLgpdAccepted(),
          user.getPasswordHash() != null
              ? user.getPasswordHash().substring(0, Math.min(10, user.getPasswordHash().length()))
              : "NULL");

      if (user.getPhoneNumber() != null && !user.getPhoneNumber().isBlank()) {
        log.info("AUTH >> iniciando MFA para: {}", request.getEmail());
        mfaService.generateAndSend(user.getId(), user.getPhoneNumber());
        return LoginResponseDTO.mfaChallenge(user.getId());
      }

      log.info("AUTH >> emitindo token para: {}", request.getEmail());
      return issueFullResponse(userDetails, user);

    } catch (DisabledException ex) {
      log.error("AUTH >> usuário desabilitado: {} — {}", request.getEmail(), ex.getMessage());
      throw new BadCredentialsException("Email ou senha inválidos");
    } catch (BadCredentialsException ex) {
      log.error("AUTH >> credenciais inválidas: {} — {}", request.getEmail(), ex.getMessage());
      throw new BadCredentialsException("Email ou senha inválidos");
    } catch (AuthenticationException ex) {
      log.error(
          "AUTH >> AuthenticationException inesperada: {} — {} ({})",
          request.getEmail(),
          ex.getMessage(),
          ex.getClass().getSimpleName());
      throw new BadCredentialsException("Email ou senha inválidos");
    } catch (Exception ex) {
      log.error(
          "AUTH >> ERRO INESPERADO no login de {}: {} ({})",
          request.getEmail(),
          ex.getMessage(),
          ex.getClass().getName(),
          ex);
      throw ex;
    }
  }

  public LoginResponseDTO verifyMfa(MfaVerifyRequestDTO request) {
    mfaService.validate(request.getUserId(), request.getCode());

    User user =
        userRepository
            .findById(request.getUserId())
            .orElseThrow(() -> new NotFoundException("Usuário não encontrado"));

    UserDetails userDetails = buildUserDetails(user);
    return issueFullResponse(userDetails, user);
  }

  public LoginResponseDTO refresh(RefreshRequestDTO request) {
    RefreshToken old = refreshTokenService.validateAndRotate(request.getRefreshToken());

    User user =
        userRepository
            .findById(old.getUserId())
            .orElseThrow(() -> new NotFoundException("Usuário não encontrado"));

    if (user.getStatus() != UserStatus.ACTIVE) {
      throw new BusinessException("Usuário não está ativo");
    }

    UserDetails userDetails = buildUserDetails(user);
    String newAccessToken = tokenService.generateToken(userDetails);
    RefreshToken newRefresh = refreshTokenService.generate(user.getId());

    return buildFullResponse(newAccessToken, newRefresh.getToken(), user);
  }

  public void logout(Long userId) {
    refreshTokenService.revokeAll(userId);
  }

  private LoginResponseDTO issueFullResponse(UserDetails userDetails, User user) {
    String accessToken = tokenService.generateToken(userDetails);
    RefreshToken refreshToken = refreshTokenService.generate(user.getId());
    return buildFullResponse(accessToken, refreshToken.getToken(), user);
  }

  private LoginResponseDTO buildFullResponse(String accessToken, String refreshToken, User user) {
    UserRole role = UserRole.valueOf(user.getRole().name());

    return new LoginResponseDTO(
        accessToken,
        refreshToken,
        "Bearer",
        role,
        false,
        user.getId(),
        user.getEmail(),
        user.getOrganization() != null ? user.getOrganization().getId() : null,
        user.getUnit() != null ? user.getUnit().getId() : null);
  }

  private UserDetails buildUserDetails(User user) {
    return new org.springframework.security.core.userdetails.User(
        user.getEmail(),
        user.getPasswordHash() != null ? user.getPasswordHash() : "",
        List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())));
  }
}
