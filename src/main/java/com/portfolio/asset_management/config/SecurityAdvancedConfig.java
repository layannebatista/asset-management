package com.portfolio.asset_management.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Bean;

import java.time.Duration;
import java.util.Set;

@Configuration
public class SecurityAdvancedConfig {

    @Bean
    public TokenPolicy tokenPolicy() {
        return new TokenPolicy(
                Duration.ofMinutes(15),   // access token
                Duration.ofDays(7),       // refresh token
                Duration.ofMinutes(10)    // magic link
        );
    }

    @Bean
    public AbacPolicyConfig abacPolicyConfig() {
        return new AbacPolicyConfig(
                Set.of("BRANCH", "ROLE", "ASSET_STATUS"),
                true
        );
    }

    public static class TokenPolicy {
        private final Duration accessTokenTtl;
        private final Duration refreshTokenTtl;
        private final Duration magicLinkTtl;

        public TokenPolicy(Duration accessTokenTtl,
                           Duration refreshTokenTtl,
                           Duration magicLinkTtl) {
            this.accessTokenTtl = accessTokenTtl;
            this.refreshTokenTtl = refreshTokenTtl;
            this.magicLinkTtl = magicLinkTtl;
        }
    }

    public static class AbacPolicyConfig {
        private final Set<String> attributes;
        private final boolean strictMode;

        public AbacPolicyConfig(Set<String> attributes, boolean strictMode) {
            this.attributes = attributes;
            this.strictMode = strictMode;
        }
    }
}
