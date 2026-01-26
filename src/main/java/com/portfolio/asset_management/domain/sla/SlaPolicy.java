package com.portfolio.asset_management.domain.sla;

import jakarta.persistence.*;
import java.time.Duration;
import java.util.UUID;

@Entity
@Table(name = "sla_policies")
public class SlaPolicy {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "policy_name", nullable = false, unique = true)
    private String policyName;

    @Column(name = "max_duration_hours", nullable = false)
    private long maxDurationHours;

    @Column(name = "applies_to_category", nullable = false)
    private String appliesToCategory;

    @Column(name = "active", nullable = false)
    private boolean active = true;

    protected SlaPolicy() {
    }

    public SlaPolicy(String policyName, long maxDurationHours, String appliesToCategory) {
        this.policyName = policyName;
        this.maxDurationHours = maxDurationHours;
        this.appliesToCategory = appliesToCategory;
    }

    public UUID getId() {
        return id;
    }

    public String getPolicyName() {
        return policyName;
    }

    public Duration getMaxDuration() {
        return Duration.ofHours(maxDurationHours);
    }

    public String getAppliesToCategory() {
        return appliesToCategory;
    }

    public boolean isActive() {
        return active;
    }
}
