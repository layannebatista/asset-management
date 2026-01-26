package com.portfolio.asset_management.api.controller;

import com.portfolio.asset_management.api.dto.LoginRequest;
import com.portfolio.asset_management.api.dto.LoginResponse;
import com.portfolio.asset_management.application.service.security.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @RequestBody LoginRequest request
    ) {
        String token = authService.login(
                request.getUsername(),
                request.getPassword()
        );

        return ResponseEntity.ok(new LoginResponse(token));
    }
}
